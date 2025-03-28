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

local POLLS_LIMIT = 128;
local POLL_PAYLOAD_LIMIT = 1024;

-- Logs a warning and returns true if a room does not
-- have poll data associated with it.
local function check_polls(room)
    if room.polls == nil then
        module:log("warn", "no polls data in room");
        return true;
    end
    return false;
end

--- Returns a table having occupant id and occupant name.
--- If the id cannot be extracted from nick a nil value is returned
--- if the occupant name cannot be extracted from presence the Fellow Jitster
--- name is used
local function get_occupant_details(occupant)
    if not occupant then
        return nil
    end
    local presence = occupant:get_presence();
    local occupant_name;
    if presence then
        occupant_name = presence:get_child("nick", NS_NICK) and presence:get_child("nick", NS_NICK):get_text() or 'Fellow Jitster';
    else
        occupant_name = 'Fellow Jitster'
    end
    local _, _, occupant_id = jid.split(occupant.nick)
    if not occupant_id then
        return nil
    end
    return { ["occupant_id"] = occupant_id, ["occupant_name"] = occupant_name }
end

-- Sets up poll data in new rooms.
module:hook("muc-room-created", function(event)
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
module:hook('jitsi-endpoint-message-received', function(event)
    local data, error, occupant, room, origin, stanza
        = event.message, event.error, event.occupant, event.room, event.origin, event.stanza;

    if not data or (data.type ~= "new-poll" and data.type ~= "answer-poll") then
        return;
    end

    if string.len(event.raw_message) >= POLL_PAYLOAD_LIMIT then
        module:log('error', 'Poll payload too large, discarding. Sender: %s to:%s', stanza.attr.from, stanza.attr.to);
        return nil;
    end

    if data.type == "new-poll" then
        if check_polls(room) then return end

        local poll_creator = get_occupant_details(occupant)
        if not poll_creator then
            module:log("error", "Cannot retrieve poll creator id and name for %s from %s", occupant.jid, room.jid)
            return
        end

        if room.polls.count >= POLLS_LIMIT then
            module:log("error", "Too many polls created in %s", room.jid)
            return
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
        for i, name in ipairs(data.answers) do
            table.insert(answers, { name = name, voters = {} });
            table.insert(compact_answers, { key = i, name = name});
        end

        local poll = {
            id = data.pollId,
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
        module:fire_event("poll-created", pollData);
    elseif data.type == "answer-poll" then
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
            pollId = poll.id,
            voterName = voter.occupant_name,
            voterId = voter.occupant_id,
            answers = answers
        }
        module:fire_event("answer-poll",  answerData);
    end
end);

-- Sends the current poll state to new occupants after joining a room.
module:hook("muc-occupant-joined", function(event)
    local room = event.room;
    if is_healthcheck_room(room.jid) then return end
    if room.polls == nil or #room.polls.order == 0 then
        return
    end

    local data = {
        type = "old-polls",
        polls = {},
    };
    for i, poll in ipairs(room.polls.order) do
        data.polls[i] = {
            id = poll.id,
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

    local stanza = st.message({
        from = room.jid,
        to = event.occupant.jid
    })
    :tag("json-message", { xmlns = "http://jitsi.org/jitmeet" })
    :text(json_msg_str)
    :up();
    room:route_stanza(stanza);
end);
