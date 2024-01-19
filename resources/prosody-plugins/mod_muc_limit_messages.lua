-- A module to limit the number of messages in a meeting
-- Needs to be activated under the muc component where the limit needs to be applied
-- Copyright (C) 2023-present 8x8, Inc.

local id = require 'util.id';
local st = require 'util.stanza';

local get_room_by_name_and_subdomain = module:require 'util'.get_room_by_name_and_subdomain;

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
    if not session or not session.jitsi_web_query_room then
        -- if this is a message from visitor, pass it through. Limits are applied in the visitor node.
        if event.origin.type == 's2sin' then
            return;
        end

        return false;
    end

    -- get room name with tenant and find room
    local room = get_room_by_name_and_subdomain(session.jitsi_web_query_room, session.jitsi_web_query_prefix);
    if not room then
        module:log('warn', 'No room found found for %s/%s',
            session.jitsi_web_query_prefix, session.jitsi_web_query_room);
        return false;
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
module:hook('message/full', on_message); -- private messages
module:hook('message/bare', on_message); -- room messages

module:hook_global('config-reloaded', load_config);
