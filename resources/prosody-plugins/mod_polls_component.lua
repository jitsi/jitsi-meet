-- This module provides persistence for the "polls" feature,
-- by keeping track of the state of polls in each room, and sending
-- that state to new participants when they join.

local it = require 'util.iterators';
local json = require 'cjson.safe';
local array = require 'util.array';
local st = require("util.stanza");
local jid = require "util.jid";
local util = module:require("util");
local muc = module:depends("muc");

local NS_NICK = 'http://jabber.org/protocol/nick';
local get_room_by_name_and_subdomain = util.get_room_by_name_and_subdomain;
local get_room_from_jid = util.get_room_from_jid;
local is_healthcheck_room = util.is_healthcheck_room;
local room_jid_match_rewrite = util.room_jid_match_rewrite;
local internal_room_jid_match_rewrite = util.internal_room_jid_match_rewrite;
local table_compare = util.table_compare;

local POLLS_LIMIT = 128;
local POLL_PAYLOAD_LIMIT = 1024;

local main_virtual_host = module:get_option_string('muc_mapper_domain_base');
if not main_virtual_host then
    module:log('warn', 'No muc_mapper_domain_base option set.');
    return;
end
local muc_domain_prefix = module:get_option_string('muc_mapper_domain_prefix', 'conference');

-- this is the main virtual host of the main prosody that this vnode serves
local main_domain = module:get_option_string('main_domain');
-- only the visitor prosody has main_domain setting
local is_visitor_prosody = main_domain ~= nil;


local function validate_polls(data)
    if type(data) ~= 'table' then
        return false;
    end
    if data.type ~= 'polls' or type(data.pollId) ~= 'string' then
        return false;
    end
    if data.command ~= 'new-poll' and data.command ~= 'answer-poll' then
        return false;
    end
    if type(data.answers) ~= 'table' or #data.answers == 0 then
        return false;
    end

    if data.command == "new-poll" then
        if type(data.question) ~= 'string' then
            return false;
        end

        for _, answer in ipairs(data.answers) do
            if type(answer) ~= "table" or type(answer.name) ~= "string" then
                return false;
            end
        end

        return true;
    elseif data.command == "answer-poll" then
        for _, answer in ipairs(data.answers) do
            if type(answer) ~= "boolean" then
                return false;
            end
        end

        return true;
    end

    return false;
end

--- Returns a table having occupant id and occupant name.
--- If the id cannot be extracted from nick a nil value is returned same and for name
local function get_occupant_details(occupant)
    if not occupant then
        return nil
    end
    local presence = occupant:get_presence();
    local occupant_name;
    if presence then
        occupant_name = presence:get_child_text('nick', NS_NICK);
    end
    local _, _, occupant_id = jid.split(occupant.nick)
    if not occupant_id then
        return nil
    end
    return { ["occupant_id"] = occupant_id, ["occupant_name"] = occupant_name }
end

local function send_polls_message(room, data_str, to)
    local stanza = st.message({
        from = module.host,
        to = to
    })
    :tag("json-message", { xmlns = "http://jitsi.org/jitmeet" })
    :text(data_str)
    :up();
    room:route_stanza(stanza);
end

local function send_polls_message_to_all(room, data_str)
    for _, room_occupant in room:each_occupant() do
        -- in case of visitor node send only to visitors
        if not is_visitor_prosody or room_occupant.role == 'visitor' then
            send_polls_message(room, data_str, room_occupant.jid);
        end
    end
end

    -- Keeps track of the current state of the polls in each room,
    -- by listening to "new-poll" and "answer-poll" messages,
    -- and updating the room poll data accordingly.
    -- This mirrors the client-side poll update logic.
    module:hook('message/host', function(event)
        local session, stanza = event.origin, event.stanza;

        -- we are interested in all messages without a body that are not groupchat
        if stanza.attr.type == 'groupchat' or stanza:get_child('body') then
            return;
        end

        local json_message = stanza:get_child('json-message', 'http://jitsi.org/jitmeet')
            or stanza:get_child('json-message');
        if not json_message then
            return;
        end

        local room;
        local occupant;
        if session.type == 's2sin' then
            if not json_message.attr.roomJid then
                module:log('warn', 'No room jid found in %s', stanza);
                return;
            end
            room = get_room_from_jid(room_jid_match_rewrite(json_message.attr.roomJid));
        else
            local main_room = get_room_by_name_and_subdomain(session.jitsi_web_query_room, session.jitsi_web_query_prefix);
            local occupant_jid = stanza.attr.from;

            occupant = main_room:get_occupant_by_real_jid(occupant_jid);

            if main_room._data.breakout_rooms_active and not occupant then
                -- let's find is this participant in the main room or in some breakout room
                -- not in main room, let's check breakout rooms
                for breakout_room_jid, subject in pairs(main_room._data.breakout_rooms or {}) do
                    local breakout_room = get_room_from_jid(breakout_room_jid);
                    occupant = breakout_room:get_occupant_by_real_jid(occupant_jid);
                    if occupant then
                        room = breakout_room;
                        break;
                    end
                end
            else
                room = main_room;
            end

            if not occupant then
                module:log('error', 'Occupant sending poll msg %s was not found in room %s', occupant_jid, room.jid)
                return;
            end
        end

        if not room then
            module:log('warn', 'No room found for %s %s', session.jitsi_web_query_room, session.jitsi_web_query_prefix);
            return;
        end

        local json_message_text = json_message:get_text();
        if string.len(json_message_text) >= POLL_PAYLOAD_LIMIT then
            module:log('error', 'Poll payload too large, discarding. Sender: %s to:%s', stanza.attr.from, stanza.attr.to);
            return true;
        end

        local data, error = json.decode(json_message_text);
        if error then
            module:log('error', 'Error decoding data error:%s Sender: %s to:%s', error, stanza.attr.from, stanza.attr.to);
            return true;
        end

        if not data or (data.command ~= "new-poll" and data.command ~= "answer-poll") then
            return;
        end

        if not validate_polls(data) then
            module:log('error', 'Invalid poll data. Sender: %s (%s)', stanza.attr.from, json_message_text);
            return true;
        end

        local occupant_details;
        if session.type ~= 's2sin' then
            local occupant_jid = stanza.attr.from;
            occupant_details = get_occupant_details(occupant)
            if not occupant_details then
                module:log("error", "Cannot retrieve poll creator or voter id and name for %s from %s",
                    occupant.jid, room.jid)
                return
            end
        else
            -- this is a message from a visitor prosody, we will trust it
            occupant_details = { occupant_id = data.senderId; occupant_name = data.senderName; };
        end

        if data.command == "new-poll" then
            if is_visitor_prosody then
                module:log("error", "Poll cannot be created on visitor node.");
                session.send(st.error_reply(stanza, 'cancel', 'not-allowed', 'Poll cannot be created by visitor node'));
                return true;
            end

            local poll_creator = occupant_details;

            if room.polls.count >= POLLS_LIMIT then
                module:log("error", "Too many polls created in %s", room.jid)
                return true;
            end

            if room.polls.by_id[data.pollId] ~= nil then
                module:log("error", "Poll already exists: %s", data.pollId);
                session.send(st.error_reply(stanza, 'cancel', 'not-allowed', 'Poll already exists'));
                return true;
            end

            if room.jitsiMetadata and room.jitsiMetadata.permissions
                and room.jitsiMetadata.permissions.pollCreationRestricted
                and not is_feature_allowed('create-polls', session.jitsi_meet_context_features) then
                    session.send(st.error_reply(stanza, 'cancel', 'not-allowed', 'Creation of polls not allowed for user'));
                    return true;
            end

            local answers = {}
            local compact_answers = {}
            for i, a in ipairs(data.answers) do
                table.insert(answers, { name = a.name });
                table.insert(compact_answers, { key = i, name = a.name});
            end

            local poll = {
                pollId = data.pollId,
                senderId = poll_creator.occupant_id,
                senderName = poll_creator.occupant_name,
                question = data.question,
                answers = answers
            };

            room.polls.by_id[data.pollId] = poll
            table.insert(room.polls.order, poll)
            room.polls.count = room.polls.count + 1;

            local pollData = {
                event = event,
                room = room,
                poll = {
                    pollId = data.pollId,
                    senderId = poll_creator.occupant_id,
                    senderName = poll_creator.occupant_name,
                    question = data.question,
                    answers = compact_answers
                }
            }

            -- now send message to all participants
            data.senderId = poll_creator.occupant_id;
            data.type = 'polls';
            local json_msg_str, error = json.encode(data);
            if not json_msg_str then
                module:log('error', 'Error encoding data room:%s error:%s', room.jid, error);
            end
            send_polls_message_to_all(room, json_msg_str);

            module:context(jid.host(room.jid)):fire_event('poll-created', pollData);
        elseif data.command == "answer-poll" then
            local poll = room.polls.by_id[data.pollId];
            if poll == nil then
                module:log("warn", "answering inexistent poll %s", data.pollId);
                return;
            end

            local voter = occupant_details;

            local answers = {};
            for vote_option_idx, vote_flag in ipairs(data.answers) do
                local answer = poll.answers[vote_option_idx]

                table.insert(answers, {
                    key = vote_option_idx,
                    value = vote_flag,
                    name = answer.name,
                });

                if vote_flag then
                    local voters = answer.voters;
                    if not voters then
                        answer.voters = {};
                        voters = answer.voters;
                    end

                    table.insert(voters, {
                        id = voter.occupant_id;
                        name = vote_flag and voter.occupant_name or nil;
                    });
                end
            end

            local answerData = {
                data = data,
                event = event,
                room = room,
                pollId = poll.pollId,
                voterName = voter.occupant_name,
                voterId = voter.occupant_id,
                answers = answers,
            }

            data.senderId = voter.occupant_id;
            data.senderName = voter.occupant_name;
            data.type = 'polls';
            local json_msg_str, error = json.encode(data);
            if not json_msg_str then
                module:log('error', 'Error encoding data room:%s error:%s', room.jid, error);
                return;
            end
            send_polls_message_to_all(room, json_msg_str);

            module:context(jid.host(room.jid)):fire_event('answer-poll',  answerData);
        end

    return true;
end);

-- Find in which poll in newPolls we have updated answers
-- @returns poll, senderId, array of boolean values for the answers of this sender
function find_updated_poll(oldPolls, newPolls)
    for _, v in pairs(newPolls) do
        local existing_poll = oldPolls[v.pollId];
        local senderId;

        for idx, newAnswer in ipairs(v.answers) do
            -- let's examine now the voters
            -- Create lookup tables using id as key for efficient searching
            local oldLookup = {}
            local newLookup = {}

            -- Build lookup table for old array
            if existing_poll.answers[idx].voters then
                for _, element in ipairs(existing_poll.answers[idx].voters) do
                    oldLookup[element.id] = element
                end
            end

            -- Build lookup table for new array
            if newAnswer.voters then
                for _, element in ipairs(newAnswer.voters) do
                    newLookup[element.id] = element
                end
            end

            -- Find removed elements (in old but not in new)
            if existing_poll.answers[idx].voters then
                for _, element in ipairs(existing_poll.answers[idx].voters) do
                    if not newLookup[element.id] then
                        senderId = element.id;
                    end
                end
            end

            -- Find added elements (in new but not in old)
            if newAnswer.voters then
                for _, element in ipairs(newAnswer.voters) do
                    if not oldLookup[element.id] then
                        senderId = element.id;
                    end
                end
            end
        end

        if senderId ~= nil then
            -- an array of true/false values for this sender
            local senderAnswers = {};
            for idx, newAnswer in ipairs(v.answers) do
                senderAnswers[idx] = false;
                if newAnswer.voters then
                    for _, element in ipairs(newAnswer.voters) do
                        if element.id == senderId then
                            senderAnswers[idx] = true;
                        end
                    end
                end
            end

            return v, senderId, senderAnswers;
        end
    end
end

local setup_muc_component = function(host_module, host)
    -- Sets up poll data in new rooms.
    host_module:hook("muc-room-created", function(event)
        local room = event.room;
        if is_healthcheck_room(room.jid) then return end
        room.polls = {
            by_id = {};
            order = {};
            count = 0;
        };
    end);

    -- Sends the current poll state to new occupants after joining a room.
    host_module:hook("muc-occupant-joined", function(event)
        local room = event.room;
        if is_healthcheck_room(room.jid) then return end
        if room.polls == nil or #room.polls.order == 0 then
            return
        end

        local data = {
            command = "old-polls",
            polls = {},
            type = 'polls'
        };
        for i, poll in ipairs(room.polls.order) do
            data.polls[i] = {
                pollId = poll.pollId,
                senderId = poll.senderId,
                senderName = poll.senderName,
                question = poll.question,
                answers = poll.answers
            };
        end

        local json_msg_str, error = json.encode(data);
        if not json_msg_str then
            module:log('error', 'Error encoding data room:%s error:%s', room.jid, error);
        end
        send_polls_message(room, json_msg_str, event.occupant.jid);
    end);

    -- Handles poll updates coming for a visitor node, the event contain polls structure
    -- like 'old-polls' one
    host_module:hook('jitsi-polls-update', function(event)
        local polls_command, room = event.polls, event.room;
        -- this is the initial state coming from the main prosody when only jicofo is in the room
        if room.polls.count == 0 and it.count(room:each_occupant()) == 1 then
            for i, v in ipairs(polls_command.polls) do
                room.polls.by_id[v.pollId] = v;
                table.insert(room.polls.order, v);
                room.polls.count = room.polls.count + 1;
            end

            return;
        end

        -- at this point we need to find which is the new poll
        local new_poll;
        for _, v in pairs(polls_command.polls) do
             if not room.polls.by_id[v.pollId] then
                new_poll = v;
                break;
             end
        end

        if not new_poll then
            -- this is an update of the voters in some of the existing polls
            local updatedPoll, senderId, answers = find_updated_poll(room.polls.by_id, polls_command.polls);

            if not updatedPoll then
                module:log('warn', 'no new or updated poll found in update for room %s', room.jid);
                return;
            end

            local data = {
                answers = answers,
                command = 'answer-poll',
                pollId = updatedPoll.pollId,
                senderId = senderId,
                roomJid = internal_room_jid_match_rewrite(room.jid),
                type = 'polls'
            };

            -- we need to update the history
            room.polls.by_id[updatedPoll.pollId].answers = updatedPoll.answers;

            local json_msg_str, error = json.encode(data);
            if not json_msg_str then
                module:log('error', 'Error encoding data room:%s error:%s', room.jid, error);
            end
            send_polls_message_to_all(room, json_msg_str);

            return;
        end

        room.polls.by_id[new_poll.pollId] = new_poll;
        table.insert(room.polls.order, new_poll);
        room.polls.count = room.polls.count + 1;

        local data = {
            answers = new_poll.answers,
            command = 'new-poll',
            pollId = new_poll.pollId,
            question = new_poll.question,
            senderId = new_poll.senderId,
            roomJid = internal_room_jid_match_rewrite(room.jid),
            type = 'polls'
        };

        local json_msg_str, error = json.encode(data);
        if not json_msg_str then
            module:log('error', 'Error encoding data room:%s error:%s', room.jid, error);
        end

        send_polls_message_to_all(room, json_msg_str);
    end);
end

process_host_module(muc_domain_prefix..'.'..main_virtual_host, setup_muc_component);
process_host_module('breakout.' .. main_virtual_host, setup_muc_component);

process_host_module(main_virtual_host, function(host_module)
    module:context(host_module.host):fire_event('jitsi-add-identity', {
        name = 'polls'; host = module.host;
    });
end);
