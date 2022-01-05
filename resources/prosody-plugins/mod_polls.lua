-- This module provides persistence for the "polls" feature,
-- by keeping track of the state of polls in each room, and sending
-- that state to new participants when they join.

local json = require("util.json");
local st = require("util.stanza");

local util = module:require("util");
local muc = module:depends("muc");

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

        local poll = room.polls.by_id[data.pollId];
        if poll == nil then
            module:log("warn", "answering inexistent poll");
            return;
        end

        local answers = {};
        for i, value in ipairs(data.answers) do
            table.insert(answers, {
                key = i,
                value = value,
                name = poll.answers[i].name,
            });
            poll.answers[i].voters[data.voterId] = value and data.voterName or nil;
        end
        local answerData = {
            event = event,
            room = room,
            pollId = poll.id,
            voterName = data.voterName,
            voterId = data.voterId,
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
