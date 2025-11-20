-- enable under the main muc module
-- a module that will filter group messages based on features (jitsi_meet_context_features)
-- when requested via metadata (permissions.groupChatRestricted)
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
        module:log('warn', 'No room found found for %s', stanza.attr.to);
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
