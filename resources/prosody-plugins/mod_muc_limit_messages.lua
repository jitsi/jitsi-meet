-- A module to limit the number of messages in a meeting
-- Needs to be activated under the muc component where the limit needs to be applied
-- Copyright (C) 2023-present 8x8, Inc.

local id = require 'util.id';
local st = require 'util.stanza';

local get_room_by_name_and_subdomain = module:require 'util'.get_room_by_name_and_subdomain;

local messages_per_room = module:get_option_number('muc_limit_messages_count');
if not messages_per_room then
    module:log('warn', "No 'muc_limit_messages_count' option set, disabling module");
    return
end

local drop_limits_authenticated = module:get_option_boolean('muc_limit_messages_check_token', false);

module:log('info', 'Loaded muc limits for %s, limit:%s, will check for authenticated users:%s',
    module.host, messages_per_room, drop_limits_authenticated);

local error_text = 'This room has limit of '..messages_per_room..' messages.';

function on_message(event)
    local stanza = event.stanza;
    local body = stanza:get_child('body');
    -- we ignore any message without a body (messages used by lobby), messages with type groupchat
    -- are used by polls
    if not body and stanza.attr.type ~= 'groupchat' then
        return;
    end

    local session = event.origin;
    if not session or not session.jitsi_web_query_room then
        return false;
    end

    -- get room name with tenant and find room
    local room = get_room_by_name_and_subdomain(session.jitsi_web_query_room, session.jitsi_web_query_prefix);
    if not room then
        module:log('warn', 'No room found found for %s/%s',
            session.jitsi_web_query_prefix, session.jitsi_web_query_room);
        return false;
    end

    if drop_limits_authenticated and session.auth_token then
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
    if room._muc_messages_limit_count == messages_per_room + 1 then
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
module:hook('message/full', on_message); -- private messages
module:hook('message/bare', on_message); -- room messages
