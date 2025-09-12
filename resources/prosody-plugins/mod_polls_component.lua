-- This module provides persistence for the "polls" feature,
-- by keeping track of the state of polls in each room, and sending
-- that state to new participants when they join.

local json = require 'cjson.safe';
local st = require("util.stanza");
local jid = require "util.jid";
local util = module:require("util");
local muc = module:depends("muc");

local NS_NICK = 'http://jabber.org/protocol/nick';
local is_healthcheck_room = util.is_healthcheck_room;
local room_jid_match_rewrite = util.room_jid_match_rewrite;

local POLLS_LIMIT = 128;
local POLL_PAYLOAD_LIMIT = 1024;

local main_virtual_host = module:get_option_string('muc_mapper_domain_base');
if not main_virtual_host then
    module:log('warn', 'No muc_mapper_domain_base option set.');
    return;
end
local muc_domain_prefix = module:get_option_string('muc_mapper_domain_prefix', 'conference');

-- Logs a warning and returns true if a room does not
-- have poll data associated with it.
local function check_polls(room)
    if room.polls == nil then
        module:log("warn", "no polls data in room");
        return true;
    end
    return false;
end

local function validate_polls(data)
    if type(data) ~= 'table' then
        return false;
    end
    if data.type ~= 'polls' or type(data.pollId) ~= 'string'
        or type(data.roomJid) ~= 'string' then
        return false;
    end
    if data.command ~= 'new-poll' and data.command ~= 'answer-poll' then
        return false;
    end
    if type(data.answers) ~= 'table' then
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
        occupant_name = presence:get_child("nick", NS_NICK) and presence:get_child("nick", NS_NICK):get_text() or 'Fellow Jitster';
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
        send_polls_message(room, data_str, room_occupant.jid);
    end
end

process_host_module(muc_domain_prefix..'.'..main_virtual_host, function(host_module, host)
    -- Sets up poll data in new rooms.
    host_module:hook("muc-room-created", function(event)
        local room = event.room;
        if is_healthcheck_room(room.jid) then return end
        module:log("debug", "setting up polls in room %s", room.jid);
        room.polls = {
            by_id = {};
            order = {};
            count = 0;
        };
    end);

    -- Keeps track of the current state of the polls in each room,
    -- by listening to "new-poll" and "answer-poll" messages,
    -- and updating the room poll data accordingly.
    -- This mirrors the client-side poll update logic.
    module:hook('message/host', function(event)
        local stanza = event.stanza;

        -- we are interested in all messages without a body that are not groupchat
        if stanza.attr.type == 'groupchat' or stanza:get_child('body') then
            return;
        end

        local json_message = stanza:get_child('json-message', 'http://jitsi.org/jitmeet')
            or stanza:get_child('json-message');
        if not json_message or not json_message.attr.roomJid then
            return;
        end

        local room = get_room_from_jid(room_jid_match_rewrite(json_message.attr.roomJid));
        if not room then
            module:log('warn', 'No room found found for %s', json_message.attr.roomJid);
            return;
        end

        local occupant_jid = stanza.attr.from;
        local occupant = room:get_occupant_by_real_jid(occupant_jid);
        if not occupant then
            module:log("error", "Occupant sending msg %s was not found in room %s", occupant_jid, room.jid)
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

        if data.command == "new-poll" then
            if check_polls(room) then return end

            local poll_creator = get_occupant_details(occupant)
            if not poll_creator then
                module:log("error", "Cannot retrieve poll creator id and name for %s from %s", occupant.jid, room.jid)
                return
            end

            if room.polls.count >= POLLS_LIMIT then
                module:log("error", "Too many polls created in %s", room.jid)
                return true;
            end

            if room.polls.by_id[data.pollId] ~= nil then
                module:log("error", "Poll already exists: %s", data.pollId);
                origin.send(st.error_reply(stanza, 'cancel', 'not-allowed', 'Poll already exists'));
                return true;
            end

            if room.jitsiMetadata and room.jitsiMetadata.permissions
                and room.jitsiMetadata.permissions.pollCreationRestricted
                and not is_feature_allowed('create-polls', origin.jitsi_meet_context_features) then
                    origin.send(st.error_reply(stanza, 'cancel', 'not-allowed', 'Creation of polls not allowed for user'));
                    return true;
            end

            local answers = {}
            local compact_answers = {}
            for i, a in ipairs(data.answers) do
                table.insert(answers, { name = a.name, voters = {} });
                table.insert(compact_answers, { key = i, name = a.name});
            end

            local poll = {
                pollId = data.pollId,
                sender_id = poll_creator.occupant_id,
                sender_name = poll_creator.occupant_name,
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

            host_module:fire_event("poll-created", pollData);

            -- now send message to all participants
            data.senderId = poll_creator.occupant_id;
            data.type = 'polls';
            local json_msg_str, error = json.encode(data);
            if not json_msg_str then
                module:log('error', 'Error encoding data room:%s error:%s', room.jid, error);
            end
            send_polls_message_to_all(room, json_msg_str);
        elseif data.command == "answer-poll" then
            if check_polls(room) then return end

            local poll = room.polls.by_id[data.pollId];
            if poll == nil then
                module:log("warn", "answering inexistent poll");
                return;
            end

            local voter = get_occupant_details(occupant)
            if not voter then
                module:log("error", "Cannot retrieve voter id and name for %s from %s", occupant.jid, room.jid)
                return
            end

            local answers = {};
            for vote_option_idx, vote_flag in ipairs(data.answers) do
                table.insert(answers, {
                    key = vote_option_idx,
                    value = vote_flag,
                    name = poll.answers[vote_option_idx].name,
                });
                poll.answers[vote_option_idx].voters[voter.occupant_id] = vote_flag and voter.occupant_name or nil;
            end
            local answerData = {
                event = event,
                room = room,
                pollId = poll.pollId,
                voterName = voter.occupant_name,
                voterId = voter.occupant_id,
                answers = answers
            }
            host_module:fire_event("answer-poll",  answerData);

            data.senderId = voter.occupant_id;
            data.type = 'polls';
            local json_msg_str, error = json.encode(data);
            if not json_msg_str then
                module:log('error', 'Error encoding data room:%s error:%s', room.jid, error);
            end
            send_polls_message_to_all(room, json_msg_str);
        end

        return true;
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
                senderId = poll.sender_id,
                senderName = poll.sender_name,
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
end);

process_host_module(main_virtual_host, function(host_module)
    module:context(host_module.host):fire_event('jitsi-add-identity', {
        name = 'polls'; host = module.host;
    });
end);
