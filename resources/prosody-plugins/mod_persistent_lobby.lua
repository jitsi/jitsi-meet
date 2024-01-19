-- This module allows lobby room to be created even when the main room is empty.
-- Without this module, the empty main room will get deleted after grace period
-- which triggers lobby room deletion even if there are still people in the lobby.
--
-- This module should be added to the main virtual host domain.
-- It assumes you have properly configured the muc_lobby_rooms module and lobby muc component.
--
-- To trigger creation of lobby room:
--  prosody.events.fire_event("create-persistent-lobby-room", { room = room; });
--
module:depends('room_destroy');

local util = module:require "util";
local is_healthcheck_room = util.is_healthcheck_room;
local main_muc_component_host = module:get_option_string('main_muc');
local lobby_muc_component_host = module:get_option_string('lobby_muc');


if main_muc_component_host == nil then
    module:log('error', 'main_muc not configured. Cannot proceed.');
    return;
end

if lobby_muc_component_host == nil then
    module:log('error', 'lobby not enabled missing lobby_muc config');
    return;
end


-- Helper function to wait till a component is loaded before running the given callback
local function run_when_component_loaded(component_host_name, callback)
    local function trigger_callback()
        module:log('info', 'Component loaded %s', component_host_name);
        callback(module:context(component_host_name), component_host_name);
    end

    if prosody.hosts[component_host_name] == nil then
        module:log('debug', 'Host %s not yet loaded. Will trigger when it is loaded.', component_host_name);
        prosody.events.add_handler('host-activated', function (host)
            if host == component_host_name then
                trigger_callback();
            end
        end);
    else
        trigger_callback();
    end
end

-- Helper function to wait till a component's muc module is loaded before running the given callback
local function run_when_muc_module_loaded(component_host_module, component_host_name, callback)
    local function trigger_callback()
        module:log('info', 'MUC module loaded for %s', component_host_name);
        callback(prosody.hosts[component_host_name].modules.muc, component_host_module);
    end

    if prosody.hosts[component_host_name].modules.muc == nil then
        module:log('debug', 'MUC module for %s not yet loaded. Will trigger when it is loaded.', component_host_name);
        prosody.hosts[component_host_name].events.add_handler('module-loaded', function(event)
            if (event.module == 'muc') then
                trigger_callback();
            end
        end);
    else
        trigger_callback()
    end
end


local lobby_muc_service;
local main_muc_service;
local main_muc_module;


-- Helper methods to track rooms that have persistent lobby
local function set_persistent_lobby(room)
    room._data.persist_lobby = true;
end

local function has_persistent_lobby(room)
    if room._data.persist_lobby == true then
        return true;
    else
        return false;
    end
end


-- Helper method to trigger main room destroy
local function trigger_room_destroy(room)
    prosody.events.fire_event("maybe-destroy-room", {
        room = room;
        reason = 'main room and lobby now empty';
        caller = module:get_name();
    });
end


-- For rooms with persistent lobby, we need to trigger deletion ourselves when both the main room
-- and the lobby room are empty. This will be checked each time an occupant leaves the main room
-- of if someone drops off the lobby.


-- Handle events on main muc module
run_when_component_loaded(main_muc_component_host, function(host_module, host_name)
    run_when_muc_module_loaded(host_module, host_name, function (main_muc, main_module)
        main_muc_service = main_muc;  -- so it can be accessed from lobby muc event handlers
        main_muc_module = main_module;

        main_module:hook("muc-occupant-left", function(event)
            -- Check if room should be destroyed when someone leaves the main room

            local main_room = event.room;
            if is_healthcheck_room(main_room.jid) or not has_persistent_lobby(main_room) then
                return;
            end

            local lobby_room_jid = main_room._data.lobbyroom;

            -- If occupant leaving results in main room being empty, we trigger room destroy if
            --   a) lobby exists and is not empty
            --   b) lobby does not exist (possible for lobby to be disabled manually by moderator in meeting)
            --
            -- (main room destroy also triggers lobby room destroy in muc_lobby_rooms)
            if not main_room:has_occupant() then
                if lobby_room_jid == nil then  -- lobby disabled
                    trigger_room_destroy(main_room);
                else -- lobby exists
                    local lobby_room = lobby_muc_service.get_room_from_jid(lobby_room_jid);
                    if lobby_room and not lobby_room:has_occupant() then
                        trigger_room_destroy(main_room);
                    end
                end
            end
        end);

    end);
end);


-- Handle events on lobby muc module
run_when_component_loaded(lobby_muc_component_host, function(host_module, host_name)
    run_when_muc_module_loaded(host_module, host_name, function (lobby_muc, lobby_module)
        lobby_muc_service = lobby_muc;  -- so it can be accessed from main muc event handlers

        lobby_module:hook("muc-occupant-left", function(event)
            -- Check if room should be destroyed when someone leaves the lobby

            local lobby_room = event.room;
            local main_room = lobby_room.main_room;

            if not main_room or is_healthcheck_room(main_room.jid) or not has_persistent_lobby(main_room) then
                return;
            end

            -- If both lobby room and main room are empty, we destroy main room.
            -- (main room destroy also triggers lobby room destroy in muc_lobby_rooms)
            if not lobby_room:has_occupant() and main_room and not main_room:has_occupant() then
                trigger_room_destroy(main_room);
            end

        end);
    end);
end);


function handle_create_persistent_lobby(event)
    local room = event.room;
    prosody.events.fire_event("create-lobby-room", event);

    set_persistent_lobby(room);
    room:set_persistent(true);
end


module:hook_global('create-persistent-lobby-room', handle_create_persistent_lobby);


-- Stop other modules from destroying room if persistent lobby not empty
function handle_maybe_destroy_main_room(event)
    local main_room = event.room;
    local caller = event.caller;

    if caller == module:get_name() then
        -- we were the one that requested the deletion. Do not override.
        return nil;
    end

    -- deletion was requested by another module. Check for lobby occupants.
    if has_persistent_lobby(main_room) and main_room._data.lobbyroom then
        local lobby_room_jid = main_room._data.lobbyroom;
        local lobby_room = lobby_muc_service.get_room_from_jid(lobby_room_jid);
        if lobby_room and lobby_room:has_occupant() then
            module:log('info', 'Suppressing room destroy. Persistent lobby still occupied %s', lobby_room_jid);
            return true;  -- stop room destruction
        end
    end
end

module:hook_global("maybe-destroy-room", handle_maybe_destroy_main_room);
