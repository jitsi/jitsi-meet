-- Blocks a message that a client addresses to the JID of an account.
--
-- A Jitsi client addresses a message to a MUC (the room JID for group chat, an
-- occupant JID for a private message) or to one of the Jitsi components. It
-- never addresses a message to the JID of an account. The MUC applies the
-- access rules of the room: it refuses a message from a client that is not an
-- occupant, and mod_filter_messages applies the chat restrictions of the room.
--
-- A message that goes to the JID of an account uses none of that. It goes
-- directly from one client to the other, thus the state of the room has no
-- effect on it. This module rejects such a message with a <not-allowed/>
-- error, so that client messages keep to the routes that the rooms control.
--
-- Permitted destinations:
--   * a JID with no node part (a host or a component)
--   * a local component, which includes each MUC component and the Jitsi
--     components (metadata, polls, filesharing, ...)
--   * a host that starts with the MUC prefix, for example
--     conference.v1.example.com. A participant of the main room replies to a
--     visitor at the occupant JID of the visitor on the visitor node, which is
--     a MUC on a different server.
--
-- Everything else is rejected.
--
-- The check applies to client (c2s) sessions only. It uses pre-message/bare and
-- pre-message/full, which Prosody fires on the host of the sender, and only for
-- a client connection. Messages from a component or from a server-to-server
-- connection do not go through it, thus error replies and the routing that the
-- visitors module does are not affected.
--
-- Load on each VirtualHost that clients connect to, the visitor node included.
local jid_split = require 'util.jid'.split;
local st = require 'util.stanza';

local util = module:require 'util';
local is_admin = util.is_admin;

local hosts = prosody.hosts;

local muc_domain_prefix = module:get_option_string('muc_mapper_domain_prefix', 'conference');

-- Returns true when a client is allowed to address a message to this JID.
local function is_allowed_destination(to)
    if not to then
        -- No destination means the message goes to the account of the sender.
        return true;
    end

    local node, host = jid_split(to);

    if not node then
        -- A host or a component, for example metadata.example.com.
        return true;
    end

    if not host then
        return false;
    end

    local target_host = hosts[host];

    if target_host and target_host.type == 'component' then
        -- A local component. Each MUC component is one of these.
        return true;
    end

    -- A MUC on another server. A participant of the main room uses this to
    -- answer a visitor, whose occupant JID is on the visitor node.
    if host:sub(1, #muc_domain_prefix + 1) == muc_domain_prefix .. '.' then
        return true;
    end

    return false;
end

local function on_message(event)
    local stanza, session = event.stanza, event.origin;

    if is_allowed_destination(stanza.attr.to) then
        return;
    end

    -- jicofo and the other internal clients are admins. They do not send this
    -- kind of message, but do not change what they can do.
    if session.full_jid and is_admin(session.full_jid) then
        return;
    end

    module:log('debug', 'Blocked message from %s to %s', stanza.attr.from or session.full_jid, stanza.attr.to);

    if stanza.attr.type ~= 'error' then
        session.send(st.error_reply(stanza, 'cancel', 'not-allowed', 'Messages to this address are not allowed'));
    end

    return true;
end

module:hook('pre-message/bare', on_message);
module:hook('pre-message/full', on_message);
