-- Filters MUC messages when the room operator has restricted chat.
--
-- Two independent restrictions live in the room metadata:
--
--   permissions.groupChatRestricted   — group-chat messages, addressed to the
--                                       bare room JID
--   permissions.privateChatRestricted — private messages, addressed to an
--                                       occupant JID (room@muc/nick)
--
-- When a restriction is on, a sender must have the matching feature set to true
-- in their JWT context (session.jitsi_meet_context_features) to send a message.
-- Any message that fails the check is rejected with a <not-allowed/> error
-- stanza.
--
--   groupChatRestricted    →  send-groupchat
--   privateChatRestricted  →  send-private-message
--
-- Feature evaluation via is_feature_allowed:
--   feature = true  in token features        →  allowed
--   feature = false in token features        →  blocked
--   feature key absent from token features   →  blocked
--   no token features at all (anonymous)     →  blocked
--
-- Messages without a <body> (polls, lobby notifications, etc.) are always
-- passed through regardless of the restriction flags.
--
-- Hooks:
--   message/bare                            — ordinary MUC group-chat messages
--   jitsi-visitor-groupchat-pre-route       — visitor group-chat messages, routed
--                                             via the visitors component
--   muc-private-message                     — MUC private messages
--   jitsi-visitor-private-message-pre-route — visitor private messages, routed
--                                             via the visitors component
--
-- A message that is addressed to the real JID of a participant
-- (user@domain/resource) does not go to the MUC component, thus no hook here
-- sees it.
--
-- Load on the MUC component.
local util = module:require 'util';
local get_room_from_jid = util.get_room_from_jid;
local jid_bare = require 'util.jid'.bare;
local st = require 'util.stanza';

-- Returns true when the room restricts this kind of message and the sender does
-- not have the feature that lifts the restriction.
local function is_blocked(room, session, restriction, feature)
    return room.jitsiMetadata and room.jitsiMetadata.permissions
        and room.jitsiMetadata.permissions[restriction]
        and not is_feature_allowed(feature, session.jitsi_meet_context_features);
end

-- Sends the rejection for a message that this module filters. The module routes
-- the reply, thus it also goes to a visitor node over s2s.
local function reject(stanza, session, text)
    local reply = st.error_reply(stanza, 'cancel', 'not-allowed', text);

    if session.type == 's2sin' or session.type == 's2sout' then
        reply.skipMapping = true;
    end
    module:send(reply);
end

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

    if is_blocked(room, session, 'groupChatRestricted', 'send-groupchat') then
        reject(stanza, session, 'Sending group messages not allowed');

        -- let's filter this message
        return true;
    end
end

-- Private messages that a visitor node forwards to a main participant. The
-- visitors module routes these to the occupant itself, thus muc-private-message
-- does not fire for them. Returning true filters the message, the same as
-- jitsi-visitor-groupchat-pre-route does.
local function on_visitor_private_message(event)
    local stanza = event.stanza;
    local body = stanza:get_child('body');
    local session = event.origin;

    if not body or not session then
        return;
    end

    -- The stanza is addressed to an occupant JID (room@muc/nick).
    local room = get_room_from_jid(jid_bare(stanza.attr.to));
    if not room then
        module:log('warn', 'No room found for %s', stanza.attr.to);
        return;
    end

    if is_blocked(room, session, 'privateChatRestricted', 'send-private-message') then
        reject(stanza, session, 'Sending private messages not allowed');

        return true;
    end
end

-- The MUC fires this for a private message, after it made sure that the sender
-- is an occupant of the room and that the recipient is in the room. Returning
-- false stops the routing. The MUC sends no error of its own in that case, thus
-- this function sends it.
local function on_private_message(event)
    local stanza, session, room = event.stanza, event.origin, event.room;
    local body = stanza:get_child('body');

    if not body or not session or not room then
        return;
    end

    if is_blocked(room, session, 'privateChatRestricted', 'send-private-message') then
        -- The MUC replaced the 'from' of the stanza with the occupant JID of the
        -- sender before it fired this event, thus the generated reply has that
        -- as its destination. Send the reply on the session that sent the
        -- message, the same as the MUC does for its own errors.
        session.send(st.error_reply(stanza, 'cancel', 'not-allowed', 'Sending private messages not allowed'));

        return false;
    end
end

module:hook('message/bare', on_message); -- room messages
module:hook('jitsi-visitor-groupchat-pre-route', on_message); -- visitors messages
module:hook('muc-private-message', on_private_message); -- private messages
module:hook('jitsi-visitor-private-message-pre-route', on_visitor_private_message); -- visitors private messages
