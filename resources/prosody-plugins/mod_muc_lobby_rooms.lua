-- This module added under the main virtual host domain
-- It needs a lobby muc component
--
-- VirtualHost "jitmeet.example.com"
-- modules_enabled = {
--     "muc_lobby_rooms"
-- }
-- lobby_muc = "lobby.jitmeet.example.com"
-- main_muc = "conference.jitmeet.example.com"
--
-- Component "lobbyrooms.damencho.jitsi.net" "muc"
--     storage = "memory"
--     muc_room_cache_size = 1000
--     restrict_room_creation = true
--     muc_room_locking = false
--     muc_room_default_public_jids = true
--
-- we use async to detect Prosody 0.10 and earlier
local have_async = pcall(require, "util.async");

if not have_async then
    module:log("warn", "Lobby rooms will not work with Prosody version 0.10 or less.");
    return;
end

local jid_split = require 'util.jid'.split;
local jid_bare = require 'util.jid'.bare;
local filters = require 'util.filters';
local st = require 'util.stanza';
local MUC_NS = 'http://jabber.org/protocol/muc';

local is_healthcheck_room = module:require "util".is_healthcheck_room;

local main_muc_component_config = module:get_option_string('main_muc');
if main_muc_component_config == nil then
    module:log('error', 'lobby not enabled missing main_muc config');
    return ;
end
local lobby_muc_component_config = module:get_option_string('lobby_muc');
if lobby_muc_component_config == nil then
    module:log('error', 'lobby not enabled missing lobby_muc config');
    return ;
end

local lobby_muc_service;
local main_muc_service;

-- Checks whether there is self-status 110 of the <x node
function check_self_status(muc_x)
    if not muc_x then
        return false;
    end

    for status in muc_x:childtags('status') do
        if status.attr.code == '110' then
            return true;
        end
    end

    return false;
end

function filter_stanza(stanza)
    if not stanza.attr or not stanza.attr.from or not main_muc_service then
        return stanza;
    end
    -- Allow self-presence (code=110)
    local node, from_domain = jid_split(stanza.attr.from);

    if from_domain == lobby_muc_component_config then
        if stanza.name == 'presence' then
            local muc_x = stanza:get_child('x', MUC_NS..'#user');

            if muc_x and check_self_status(muc_x) then
                return stanza;
            end

            -- check is an owner, only owners can receive the presence
            local room = main_muc_service.get_room_from_jid(jid_bare(node .. '@' .. main_muc_component_config));
            if room.get_affiliation(room, stanza.attr.to) == 'owner' then
                return stanza;
            end

            return nil;
        end

        return nil;
    else
        return stanza;
    end
end
function filter_session(session)
    if session.host and session.host == module.host then
        -- domain mapper is filtering on default priority 0, and we need it after that
        filters.add_filter(session, 'stanzas/out', filter_stanza, -1);
    end
end

-- process a host module directly if loaded or hooks to wait for its load
function process_host_module(name, callback)
    local function process_host(host)
        if host == name then
            callback(module:context(host), host);
        end
    end

    if prosody.hosts[name] == nil then
        module:log('debug', 'No host/component found, will wait for it: %s', name)

        -- when a host or component is added
        prosody.events.add_handler('host-activated', process_host);
    else
        process_host(name);
    end
end

-- operates on already loaded lobby muc module
function process_lobby_muc_loaded(lobby_muc, host_module)
    module:log('debug', 'Lobby muc loaded');
    lobby_muc_service = lobby_muc;

    -- enable filtering presences in the lobby muc rooms
    filters.add_filter_hook(filter_session);

    -- Advertise lobbyrooms support on main domain so client can pick up the address and use it
    module:add_identity('component', 'lobbyrooms', lobby_muc_component_config);

    local room_mt = lobby_muc_service.room_mt;
    -- we base affiliations (roles) in lobby muc component to be based on the roles in the main muc
    room_mt.get_affiliation = function(room, jid)
        if not room.main_room then
            module:log('error', 'No main room(%s) for %s!', room.jid, jid);
            return 'none';
        end

        -- moderators in main room are moderators here
        local role = room.main_room.get_affiliation(room.main_room, jid);
        if role then
            return role;
        end

        return 'none';
    end
end

-- process or waits to process the lobby muc component
process_host_module(lobby_muc_component_config, function(host_module, host)
    -- lobby muc component created
    module:log('info', 'Lobby component loaded %s', host);

    local muc_module = prosody.hosts[host].modules.muc;
    if muc_module then
        process_lobby_muc_loaded(muc_module, host_module);
    else
        module:log('debug', 'Will wait for muc to be available');
        prosody.hosts[host].events.add_handler('module-loaded', function(event)
            if (event.module == 'muc') then
                process_lobby_muc_loaded(prosody.hosts[host].modules.muc, host_module);
            end
        end);
    end
end);

-- process or waits to process the main muc component
process_host_module(main_muc_component_config, function(host_module, host)
    main_muc_service = prosody.hosts[host].modules.muc;

    -- adds new field to the form so moderators can use it to set shared password
    host_module:hook('muc-config-form', function(event)
        table.insert(event.form, {
            name = 'muc#roomconfig_lobbypassword';
            type = 'text-private';
            label = 'Shared Password';
            value = '';
        });
    end, 90-4);

    -- hooks when lobby is enabled to create its room, only done here or by admin
    host_module:hook('muc-config-submitted', function(event)
        local members_only = event.fields['muc#roomconfig_membersonly'] and true or nil;
        if members_only then
            local node = jid_split(event.room.jid);

            local lobby_room_jid = node .. '@' .. lobby_muc_component_config;
            if not lobby_muc_service.get_room_from_jid(lobby_room_jid) then
                local new_room = lobby_muc_service.create_room(lobby_room_jid);
                new_room.main_room = event.room;
                event.room._data.lobbyroom = lobby_room_jid;
                event.status_codes["104"] = true;

                local lobby_password = event.fields['muc#roomconfig_lobbypassword'];
                if lobby_password then
                    new_room.main_room.lobby_password = lobby_password;
                end
            end
        end
    end);
    host_module:hook("muc-disco#info", function (event)
        if (event.room._data.lobbyroom) then
            table.insert(event.form, {
                name = "muc#roominfo_lobbyroom";
                label = "Lobby room jid";
                value = "";
            });
            event.formdata["muc#roominfo_lobbyroom"] = event.room._data.lobbyroom;
        end
    end);

    host_module:hook('muc-occupant-pre-join', function (event)
        local room, stanza = event.room, event.stanza;

        if is_healthcheck_room(room.jid) then
            return;
        end

        local join = stanza:get_child("x", MUC_NS);
        if not join then
            return;
        end

        local password = join:get_child_text("lobbySharedPassword");
        if password and event.room.lobby_password and password == room.lobby_password then
            local invitee = event.stanza.attr.from;
            local affiliation = room:get_affiliation(invitee);
            if not affiliation or affiliation == 0 then
                event.occupant.role = 'participant';
                room:set_affiliation(true, jid_bare(invitee), "member");
                room:save();
            end

        -- we want to add the custom lobbyroom field to fill in the lobby room jid
        elseif room._data.members_only then
            local invitee = event.stanza.attr.from;
            local affiliation = room:get_affiliation(invitee);
            if not affiliation or affiliation == 'none' then
                local reply = st.error_reply(stanza, 'auth', 'registration-required'):up();
                reply.tags[1].attr.code = '407';
                reply:tag('x', {xmlns = MUC_NS}):up();
                reply:tag('lobbyroom'):text(room._data.lobbyroom);
                event.origin.send(reply:tag('x', {xmlns = MUC_NS}));
                return true;
            end
        end
    end, -4); -- the default hook on members_only module is on -5
end);
