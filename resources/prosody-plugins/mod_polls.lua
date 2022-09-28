-- This module provides persistence for the "polls" feature,
-- by keeping track of the state of polls in each room, and sending
-- that state to new participants when they join.

local json = require("util.json");
local st = require("util.stanza");
local jid = require "util.jid";
local util = module:require("util");
local muc = module:depends("muc");

local NS_NICK = 'http://jabber.org/protocol/nick';
local is_healthcheck_room = util.is_healthcheck_room;

-- Checks if the given stanza contains a JSON message,
-- and that the message type pertains to the polls feature.
-- If yes, returns the parsed message. Otherwise, returns nil.
local function get_poll_message(stanza)
    if stanza.attr.type ~= "groupchat" then
        return nil;
    end
    local json_data = stanza:get_child_text("json-message", "http://jitsi.org/jitmeet");
    if json_data == nil then
        return nil;
    end
    local data = json.decode(json_data);
    if not data or (data.type ~= "new-poll" and data.type ~= "answer-poll") then
        return nil;
    end
    return data;
end

-- Logs a warning and returns true if a room does not
-- have poll data associated with it.
local function check_polls(room)
    if room.polls == nil then
        module:log("warn", "no polls data in room");
        return true;
    end
    return false;
end

-- Sets up poll data in new rooms.
module:hook("muc-room-created", function(event)
    local room = event.room;
    if is_healthcheck_room(room.jid) then return end
    module:log("debug", "setting up polls in room %s", room.jid);
    room.polls = {
        by_id = {};
        order = {};
    };
end);

-- Keeps track of the current state of the polls in each room,
-- by listening to "new-poll" and "answer-poll" messages,
-- and updating the room poll data accordingly.
-- This mirrors the client-side poll update logic.
module:hook("message/bare", function(event)
    local data = get_poll_message(event.stanza);
    if data == nil then return end

    local room = muc.get_room_from_jid(event.stanza.attr.to);

    if data.type == "new-poll" then
        if check_polls(room) then return end

        local answers = {}
        local compactAnswers = {}
        for i, name in ipairs(data.answers) do
            table.insert(answers, { name = name, voters = {} });
            table.insert(compactAnswers, { key = i, name = name});
        end

        local poll = {
            id = data.pollId,
            sender_id = data.senderId,
            sender_name = data.senderName,
            question = data.question,
            answers = answers
        };

        room.polls.by_id[data.pollId] = poll
        table.insert(room.polls.order, poll)

        local pollData = {
            event = event,
            room = room,
            poll = {
                pollId = data.pollId,
                senderId = data.senderId,
                senderName = data.senderName,
                question = data.question,
                answers = compactAnswers
            }
        }

        module:fire_event("poll-created", pollData);

    elseif data.type == "answer-poll" then
        if check_polls(room) then return end

        local occupant = room:get_occupant_by_real_jid(event.stanza.attr.from);
        if not occupant then
            module:log("error", "Occupant %s does not exists for room %s", event.stanza.attr.from, room.jid)
            return
        end
        local poll = room.polls.by_id[data.pollId];
        if poll == nil then
            module:log("warn", "answering inexistent poll");
            return;
        end

        -- Retrieve voter name from the presence and participant id from the nick
        local presence = occupant:get_presence();
        local participantName = presence:get_child("nick", NS_NICK) and presence:get_child("nick", NS_NICK):get_text() or 'Fellow Jitster';
        local _, _, voterId = jid.split(occupant.nick)

        local answers = {};
        for vote_option_idx, vote_flag in ipairs(data.answers) do
            table.insert(answers, {
                key = vote_option_idx,
                value = vote_flag,
                name = poll.answers[vote_option_idx].name,
            });
            poll.answers[vote_option_idx].voters[voterId] = vote_flag and participantName or nil;
        end
        local answerData = {
            event = event,
            room = room,
            pollId = poll.id,
            voterName = participantName,
            voterId = voterId,
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

    local stanza = st.message({
        from = room.jid,
        to = event.occupant.jid
    })
    :tag("json-message", { xmlns = "http://jitsi.org/jitmeet" })
    :text(json.encode(data))
    :up();

    room:route_stanza(stanza);
end);
