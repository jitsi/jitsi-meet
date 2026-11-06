-- Enforces a per-room message count cap (muc_limit_messages_count). Once the cap
-- is reached the triggering message is rejected with <not-allowed/>, a broadcast
-- is sent to the room, and all further messages are rejected. Messages are
-- counted against the room they are addressed to, and only when the sender is
-- an occupant of that room; others (e.g. visitor messages over s2s) are passed through.
-- Messages in a breakout room count against its main room. Transcriber messages
-- (transcription results) are not counted.
-- Body-less non-groupchat messages and answer-poll json-messages are exempt from
-- counting. With muc_limit_messages_check_token = true an authenticated sender
-- permanently lifts the cap for that room.
-- Needs to be activated under the muc component where the limit needs to be applied
-- Copyright (C) 2023-present 8x8, Inc.

local id = require 'util.id';
local jid = require 'util.jid';
local st = require 'util.stanza';

local util = module:require 'util';
local get_room_from_jid = util.get_room_from_jid;
local is_transcriber = util.is_transcriber;

local count;
local check_token;

local function load_config()
    count = module:get_option_number('muc_limit_messages_count');
    check_token = module:get_option_boolean('muc_limit_messages_check_token', false);
end
load_config();

if not count then
    module:log('warn', "No 'muc_limit_messages_count' option set, disabling module");
    return
end

module:log('info', 'Loaded muc limits for %s, limit:%s, will check for authenticated users:%s',
    module.host, count, check_token);

local error_text = 'The message limit for the room has been reached. Messaging is now disabled.';

function on_message(event)
    local stanza = event.stanza;
    local body = stanza:get_child('body');
    -- we ignore any non groupchat message without a body
    if not body then
        if stanza.attr.type ~= 'groupchat' then -- lobby messages
            return;
        else
            -- we want to pass through only polls answers
            local json_data = stanza:get_child_text('json-message', 'http://jitsi.org/jitmeet');
            if json_data and string.find(json_data, 'answer-poll', 1, true) then
                return;
            end
        end
    end

    local session = event.origin;
    if not session then
        return;
    end

    -- the room the message is addressed to, private messages are addressed to an occupant of it
    local room = get_room_from_jid(jid.bare(stanza.attr.to));
    if not room then
        return;
    end

    -- mod_muc checks the sender after this handler (we hook at -1), so count only messages from occupants.
    -- Visitor messages from s2sin have no occupant here and are passed through — limits enforced at visitor node.
    if not room:get_occupant_by_real_jid(stanza.attr.from) then
        return;
    end

    -- transcription results from the transcriber are not chat
    if is_transcriber(stanza.attr.from) then
        return;
    end

    -- a breakout room shares the counter of its main room, the session names the main room it joined
    -- (mod_muc_breakout_rooms sets it) and we use it only when that main room lists this breakout room
    if session.jitsi_breakout_main_jid then
        local main_room = get_room_from_jid(session.jitsi_breakout_main_jid);
        if main_room and main_room ~= room
                and main_room._data.breakout_rooms and main_room._data.breakout_rooms[room.jid] then
            room = main_room;
        end
    end

    if check_token and session.auth_token then
        -- there is an authenticated participant drop all limits
        room._muc_messages_limit = false;
    end

    if room._muc_messages_limit == false then
        -- no limits for this room, just skip
        return;
    end

    if not room._muc_messages_limit_count then
        room._muc_messages_limit_count = 0;
    end

    room._muc_messages_limit_count = room._muc_messages_limit_count + 1;

    -- on the first message above the limit we set the limit and we send an announcement to the room
    if room._muc_messages_limit_count == count + 1 then
        module:log('warn', 'Room message limit reached: %s', room.jid);

        -- send a message to the room
        local announcement = st.message({ from = room.jid, type = 'groupchat', id = id.medium(), })
            :tag('body'):text(error_text);
        room:broadcast_message(announcement);

        room._muc_messages_limit = true;
    end

    if room._muc_messages_limit == true then
        -- return error to the sender of this message
        event.origin.send(st.error_reply(stanza, 'cancel', 'not-allowed', error_text));
        return true;
    end
end

-- handle messages sent in the component
-- 'message/host' is used for breakout rooms
-- Priority -1 ensures modules at the default priority (0) — notably
-- filter_messages — run first. Messages they block (return true) never reach
-- this handler and do not consume cap slots.
module:hook('message/full', on_message, -1); -- private messages
module:hook('message/bare', on_message, -1); -- room messages

module:hook_global('config-reloaded', load_config);
