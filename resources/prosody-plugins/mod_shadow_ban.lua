local jid = require 'util.jid';
local st = require 'util.stanza';

local util = module:require 'util';
local process_host_module = util.process_host_module;
local get_room_from_jid = util.get_room_from_jid;

--
-- Shadow-banned JIDs are now stored per-room (room.shadow_banned_jids),
-- so they are naturally cleaned up when the room is destroyed and do
-- not leak across module reloads.
--

local function get_bare_jid(value)
    if not value then
        return nil;
    end

    return jid.bare(value);
end

local function get_shadow_banned_jids(room)
    if not room.shadow_banned_jids then
        room.shadow_banned_jids = {};
    end

    return room.shadow_banned_jids;
end

local function is_shadow_banned(room, value)
    if not room then
        return false;
    end

    local bare = get_bare_jid(value);

    return bare ~= nil and room.shadow_banned_jids ~= nil and room.shadow_banned_jids[bare] == true;
end

--
-- Permission check: moderators can always shadow-ban; otherwise defer to
-- the occupant's granted feature permissions, populated by
-- mod_jitsi_permissions.lua on session.jitsi_meet_context_features
-- (from either the JWT token's context features or the non-JWT
-- default_permissions).
--
local sessions = prosody.full_sessions;

local function get_occupant_by_jid(room, jid_to_check)
    local bare = get_bare_jid(jid_to_check);

    for _, occupant in room:each_occupant() do
        if occupant.bare_jid == bare then
            return occupant;
        end
    end

    return nil;
end

local function has_shadow_ban_permission(room, actor_jid)
    local occupant = get_occupant_by_jid(room, actor_jid);

    if not occupant then
        return false;
    end

    if occupant.role == 'moderator' then
        return true;
    end

    local occupant_session = sessions[occupant.jid];

    if occupant_session and occupant_session.jitsi_meet_context_features then
        return occupant_session.jitsi_meet_context_features['shadow-ban'] == true;
    end

    return false;
end

--
-- Normal messages.
--
local function handle_message(event)
    local stanza = event.stanza;

    if not stanza or not stanza.attr then
        return;
    end

    local room = get_room_from_jid(jid.bare(stanza.attr.to));
    local from = stanza.attr.from;

    if is_shadow_banned(room, from) then
        module:log(
            'info',
            'Shadow-ban: dropping message from %s',
            get_bare_jid(from)
        );

        return true;
    end
end

--
-- Visitor messages.
--
local function handle_visitor_message(event)
    local stanza = event.stanza;

    if not stanza or not stanza.attr then
        return;
    end

    -- Prefer a room already provided on the event, if the
    -- jitsi-visitor-groupchat-pre-route event exposes one; otherwise
    -- resolve it from the stanza's destination.
    local room = event.room or get_room_from_jid(jid.bare(stanza.attr.to));
    local from = stanza.attr.from;

    if is_shadow_banned(room, from) then
        module:log(
            'info',
            'Shadow-ban: dropping visitor message from %s',
            get_bare_jid(from)
        );

        return true;
    end
end

--
-- XMPP IQ handler.
--
local shadow_ban_namespace = 'http://jitsi.org/jitmeet/shadow-ban';

local function handle_shadow_ban_iq(event)
    local origin, stanza = event.origin, event.stanza;

    if not stanza then
        return;
    end

    local shadow_ban = stanza:get_child(
        'shadow-ban',
        shadow_ban_namespace
    );

    if not shadow_ban then
        return;
    end

    local room = get_room_from_jid(stanza.attr.to);

    if not room then
        origin.send(st.error_reply(stanza, 'cancel', 'item-not-found', 'Room not found'));
        return true;
    end

    if not has_shadow_ban_permission(room, stanza.attr.from) then
        origin.send(st.error_reply(stanza, 'auth', 'forbidden', 'Not authorized to shadow-ban'));
        return true;
    end

    local target_jid = shadow_ban.attr.jid;

    if not target_jid then
        module:log('warn', 'Shadow-ban IQ received without a JID');
        origin.send(st.error_reply(stanza, 'modify', 'bad-request', 'Missing jid attribute'));
        return true;
    end

    local bare_jid = get_bare_jid(target_jid);

    if not bare_jid then
        module:log('warn', 'Shadow-ban IQ received with invalid JID: %s', tostring(target_jid));
        origin.send(st.error_reply(stanza, 'modify', 'bad-request', 'Invalid jid attribute'));
        return true;
    end

    local banned = get_shadow_banned_jids(room);
    local enabled = shadow_ban:get_text() == 'true';

    if enabled then
        banned[bare_jid] = true;
        module:log('info', 'Shadow-ban enabled via IQ for %s in room %s', bare_jid, room.jid);
    else
        banned[bare_jid] = nil;
        module:log('info', 'Shadow-ban removed via IQ for %s in room %s', bare_jid, room.jid);
    end

    --
    -- Send explicit result so the client's sendIQ success callback fires.
    --
    origin.send(st.reply(stanza));

    return true;
end

--
-- Main MUC component.
--
-- The conference JID is handled by the MUC host module.
-- Jitsi's other MUC plugins use the same process_host_module()
-- pattern to register host_module hooks.
--
local main_muc_component_config = module:get_option_string('main_muc');

if not main_muc_component_config then
    module:log(
        'error',
        'Shadow-ban disabled: missing main_muc configuration'
    );

    return;
end

process_host_module(main_muc_component_config, function(host_module, host)
    module:log(
        'info',
        'Shadow-ban hooks attached to main MUC host %s',
        host
    );

    --
    -- Advertise shadow-ban support via disco#info so the client can
    -- detect whether the feature is available before showing UI.
    --
    host_module:hook('muc-disco#info', function(event)
        local reply = event.reply;

        reply:tag('feature', { var = shadow_ban_namespace }):up();
    end);

    --
    -- IQ addressed to a conference room.
    --
    host_module:hook(
        'iq-set/bare/' .. shadow_ban_namespace .. ':shadow-ban',
        handle_shadow_ban_iq,
        1
    );

    --
    -- Also handle IQs routed through the host.
    --
    host_module:hook(
        'iq-set/host/' .. shadow_ban_namespace .. ':shadow-ban',
        handle_shadow_ban_iq,
        1
    );

    --
    -- Normal MUC messages.
    --
    host_module:hook(
        'message/bare',
        handle_message,
        100
    );

    host_module:hook(
        'message/host',
        handle_message,
        100
    );
end);

--
-- Visitor messages.
--
module:hook(
    'jitsi-visitor-groupchat-pre-route',
    handle_visitor_message,
    100
);