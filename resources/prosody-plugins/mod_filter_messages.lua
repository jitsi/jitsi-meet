-- Filters MUC group-chat messages when the room operator has restricted chat.
--
-- When room.jitsiMetadata.permissions.groupChatRestricted is true, a sender
-- must have the 'send-groupchat' feature set to true in their JWT context
-- (session.jitsi_meet_context_features) to send a message.  Any message that
-- fails this check is rejected with a <not-allowed/> error stanza.
--
-- Feature evaluation via is_feature_allowed:
--   send-groupchat = true  in token features  →  allowed
--   send-groupchat = false in token features  →  blocked
--   feature key absent from token features   →  blocked
--   no token features at all (anonymous)     →  blocked
--
-- Messages without a <body> (polls, lobby notifications, etc.) are always
-- passed through regardless of the restriction flag.
--
-- Hooks:
--   message/bare                       — ordinary MUC group-chat messages
--   jitsi-visitor-groupchat-pre-route  — visitor messages routed via the
--                                        visitors component
--
-- Load on the MUC component.
local util = module:require 'util';
local get_room_from_jid = util.get_room_from_jid;
local st = require 'util.stanza';

local function on_message(event)
    local stanza = event.stanza;
    local body = stanza:get_child('body');
    local session = event.origin;

    if not body or not session then
        -- we ignore messages without body - lobby, polls ...
        return;
    end

    -- get room name with tenant and find room.
    -- this should already been through domain mapper and this should be the real room jid [tenant]name format
    local room = get_room_from_jid(stanza.attr.to);
    if not room then
        module:log('warn', 'No room found for %s', stanza.attr.to);
        return;
    end

    if room.jitsiMetadata and room.jitsiMetadata.permissions
        and room.jitsiMetadata.permissions.groupChatRestricted
        and not is_feature_allowed('send-groupchat', session.jitsi_meet_context_features) then

            local reply = st.error_reply(stanza, 'cancel', 'not-allowed', 'Sending group messages not allowed');
            if session.type == 's2sin' or session.type == 's2sout' then
                reply.skipMapping = true;
            end
            module:send(reply);

            -- let's filter this message
            return true;
    end
end

module:hook('message/bare', on_message); -- room messages
module:hook('jitsi-visitor-groupchat-pre-route', on_message); -- visitors messages
