local jid = require 'util.jid';
local st = require 'util.stanza';

local util = module:require 'util';
local process_host_module = util.process_host_module;

--
-- JID -> true
--
-- This is intentionally in memory for the first implementation.
-- Restarting Prosody will clear the shadow-ban list.
--
local shadow_banned_jids = {};

local function get_bare_jid(value)
    if not value then
        return nil;
    end

    return jid.bare(value);
end

local function is_shadow_banned(value)
    local bare = get_bare_jid(value);

    return bare ~= nil and shadow_banned_jids[bare] == true;
end

--
-- Normal messages.
--
local function handle_message(event)
    local stanza = event.stanza;

    if not stanza or not stanza.attr then
        return;
    end

    local from = stanza.attr.from;

    if is_shadow_banned(from) then
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

    local from = stanza.attr.from;

    if is_shadow_banned(from) then
        module:log(
            'info',
            'Shadow-ban: dropping visitor message from %s',
            get_bare_jid(from)
        );

        return true;
    end
end

--
-- Internal events for adding/removing a JID.
--

module:hook('shadow-ban/jid', function(event)
    local banned_jid = get_bare_jid(event.jid);

    if not banned_jid then
        module:log(
            'warn',
            'Shadow-ban requested without a valid JID'
        );

        return;
    end

    shadow_banned_jids[banned_jid] = true;

    module:log(
        'info',
        'Shadow-ban enabled for %s',
        banned_jid
    );

    return true;
end);

module:hook('shadow-unban/jid', function(event)
    local banned_jid = get_bare_jid(event.jid);

    if not banned_jid then
        module:log(
            'warn',
            'Shadow-unban requested without a valid JID'
        );

        return;
    end

    shadow_banned_jids[banned_jid] = nil;

    module:log(
        'info',
        'Shadow-ban removed for %s',
        banned_jid
    );

    return true;
end);

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

    local enabled = shadow_ban:get_text() == 'true';

    if enabled then
        shadow_banned_jids[bare_jid] = true;
        module:log('info', 'Shadow-ban enabled via IQ for %s', bare_jid);
    else
        shadow_banned_jids[bare_jid] = nil;
        module:log('info', 'Shadow-ban removed via IQ for %s', bare_jid);
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

--
-- Temporary test hooks.
--

module:hook('shadow-ban/test', function(event)
    local banned_jid = get_bare_jid(event.jid);

    if not banned_jid then
        module:log(
            'warn',
            'Shadow-ban test requested without a valid JID'
        );

        return;
    end

    shadow_banned_jids[banned_jid] = true;

    module:log(
        'info',
        'Shadow-ban TEST enabled for %s',
        banned_jid
    );

    return true;
end);

module:hook('shadow-unban/test', function(event)
    local banned_jid = get_bare_jid(event.jid);

    if not banned_jid then
        module:log(
            'warn',
            'Shadow-unban test requested without a valid JID'
        );

        return;
    end

    shadow_banned_jids[banned_jid] = nil;

    module:log(
        'info',
        'Shadow-ban TEST removed for %s',
        banned_jid
    );

    return true;
end);
