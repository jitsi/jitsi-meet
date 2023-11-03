-- This module is added under the main virtual host domain
-- It needs a breakout rooms muc component
--
-- VirtualHost "jitmeet.example.com"
--     modules_enabled = {
--         "muc_breakout_rooms"
--     }
--     breakout_rooms_muc = "breakout.jitmeet.example.com"
--     main_muc = "muc.jitmeet.example.com"
--
-- Component "breakout.jitmeet.example.com" "muc"
--     restrict_room_creation = true
--     storage = "memory"
--     admins = { "focusUser@auth.jitmeet.example.com" }
--     muc_room_locking = false
--     muc_room_default_public_jids = true
--
-- we use async to detect Prosody 0.10 and earlier
local have_async = pcall(require, 'util.async');

if not have_async then
    module:log('warn', 'Breakout rooms will not work with Prosody version 0.10 or less.');
    return;
end

local jid_node = require 'util.jid'.node;
local jid_host = require 'util.jid'.host;
local jid_split = require 'util.jid'.split;
local json = require 'util.json';
local st = require 'util.stanza';
local uuid_gen = require 'util.uuid'.generate;

local util = module:require 'util';
local internal_room_jid_match_rewrite = util.internal_room_jid_match_rewrite;
local is_healthcheck_room = util.is_healthcheck_room;

local BREAKOUT_ROOMS_IDENTITY_TYPE = 'breakout_rooms';
-- Available breakout room functionality
local RENAME_FEATURE = 'http://jitsi.org/protocol/breakout_rooms#rename';
-- only send at most this often updates on breakout rooms to avoid flooding.
local BROADCAST_ROOMS_INTERVAL = .3;
-- close conference after this amount of seconds if all leave.
local ROOMS_TTL_IF_ALL_LEFT = 5;
local JSON_TYPE_ADD_BREAKOUT_ROOM = 'features/breakout-rooms/add';
local JSON_TYPE_MOVE_TO_ROOM_REQUEST = 'features/breakout-rooms/move-to-room';
local JSON_TYPE_REMOVE_BREAKOUT_ROOM = 'features/breakout-rooms/remove';
local JSON_TYPE_RENAME_BREAKOUT_ROOM = 'features/breakout-rooms/rename';
local JSON_TYPE_UPDATE_BREAKOUT_ROOMS = 'features/breakout-rooms/update';

local main_muc_component_config = module:get_option_string('main_muc');
if main_muc_component_config == nil then
    module:log('error', 'breakout rooms not enabled missing main_muc config');
    return ;
end
local breakout_rooms_muc_component_config = module:get_option_string('breakout_rooms_muc', 'breakout.'..module.host);

module:depends('jitsi_session');

local breakout_rooms_muc_service;
local main_muc_service;

-- Maps a breakout room jid to the main room jid
local main_rooms_map = {};

-- Utility functions

function get_main_room_jid(room_jid)
    local _, host = jid_split(room_jid);

	return
        host == main_muc_component_config
        and room_jid
        or main_rooms_map[room_jid];
end

function get_main_room(room_jid)
    local main_room_jid = get_main_room_jid(room_jid);

    return main_muc_service.get_room_from_jid(main_room_jid), main_room_jid;
end

function get_room_from_jid(room_jid)
    local host = jid_host(room_jid);

    return
        host == main_muc_component_config
        and main_muc_service.get_room_from_jid(room_jid)
        or breakout_rooms_muc_service.get_room_from_jid(room_jid);
end

function send_json_msg(to_jid, json_msg)
    local stanza = st.message({ from = breakout_rooms_muc_component_config; to = to_jid; })
         :tag('json-message', { xmlns = 'http://jitsi.org/jitmeet' }):text(json_msg):up();
    module:send(stanza);
end

function get_participants(room)
    local participants = {};

    if room then
        for room_nick, occupant in room:each_occupant() do
            -- Filter focus as we keep it as a hidden participant
            if jid_node(occupant.jid) ~= 'focus' then
                local display_name = occupant:get_presence():get_child_text(
                    'nick', 'http://jabber.org/protocol/nick');
                local real_nick = internal_room_jid_match_rewrite(room_nick);
                participants[real_nick] = {
                    jid = occupant.jid,
                    role = occupant.role,
                    displayName = display_name
                };
            end
        end
    end

    return participants;
end

function broadcast_breakout_rooms(room_jid)
    local main_room = get_main_room(room_jid);

    if not main_room or main_room.broadcast_timer then
        return;
    end

    -- Only send each BROADCAST_ROOMS_INTERVAL seconds to prevent flooding of messages.
    main_room.broadcast_timer = module:add_timer(BROADCAST_ROOMS_INTERVAL, function()
        local main_room, main_room_jid = get_main_room(room_jid);

        if not main_room then
            return;
        end

        main_room.broadcast_timer = nil;

        local real_jid = internal_room_jid_match_rewrite(main_room_jid);
        local real_node = jid_node(real_jid);
        local rooms = {
            [real_node] = {
                isMainRoom = true,
                id = real_node,
                jid = real_jid,
                name = main_room._data.subject,
                participants = get_participants(main_room)
            };
        }

        for breakout_room_jid, subject in pairs(main_room._data.breakout_rooms or {}) do
            local breakout_room = breakout_rooms_muc_service.get_room_from_jid(breakout_room_jid);
            local breakout_room_node = jid_node(breakout_room_jid)

            rooms[breakout_room_node] = {
                id = breakout_room_node,
                jid = breakout_room_jid,
                name = subject,
                participants = {}
            }

            -- The room may not physically exist yet.
            if breakout_room then
                rooms[breakout_room_node].participants = get_participants(breakout_room);
            end
        end

        local json_msg = json.encode({
            type = BREAKOUT_ROOMS_IDENTITY_TYPE,
            event = JSON_TYPE_UPDATE_BREAKOUT_ROOMS,
            roomCounter = main_room._data.breakout_rooms_counter,
            rooms = rooms
        });

        for _, occupant in main_room:each_occupant() do
            if jid_node(occupant.jid) ~= 'focus' then
                send_json_msg(occupant.jid, json_msg)
            end
        end

        for breakout_room_jid in pairs(main_room._data.breakout_rooms or {}) do
            local room = breakout_rooms_muc_service.get_room_from_jid(breakout_room_jid);
            if room then
                for _, occupant in room:each_occupant() do
                    if jid_node(occupant.jid) ~= 'focus' then
                        send_json_msg(occupant.jid, json_msg)
                    end
                end
            end
        end
    end);
end


-- Managing breakout rooms

function create_breakout_room(room_jid, subject)
    local main_room, main_room_jid = get_main_room(room_jid);
    local breakout_room_jid = uuid_gen() .. '@' .. breakout_rooms_muc_component_config;

    if not main_room._data.breakout_rooms then
        main_room._data.breakout_rooms = {};
        main_room._data.breakout_rooms_counter = 0;
    end
    main_room._data.breakout_rooms_counter = main_room._data.breakout_rooms_counter + 1;
    main_room._data.breakout_rooms[breakout_room_jid] = subject;
    main_room._data.breakout_rooms_active = true;
    -- Make room persistent - not to be destroyed - if all participants join breakout rooms.
    main_room:set_persistent(true);
    main_room:save(true);

    main_rooms_map[breakout_room_jid] = main_room_jid;
    broadcast_breakout_rooms(main_room_jid);
end

function destroy_breakout_room(room_jid, message)
    local main_room, main_room_jid = get_main_room(room_jid);

    if room_jid == main_room_jid then
        return;
    end

    local breakout_room = breakout_rooms_muc_service.get_room_from_jid(room_jid);

    if breakout_room then
        message = message or 'Breakout room removed.';
        breakout_room:destroy(main_room and main_room_jid or nil, message);
    end
    if main_room then
        if main_room._data.breakout_rooms then
            main_room._data.breakout_rooms[room_jid] = nil;
        end
        main_room:save(true);

        main_rooms_map[room_jid] = nil;
        broadcast_breakout_rooms(main_room_jid);
    end
end


function rename_breakout_room(room_jid, name)
    local main_room, main_room_jid = get_main_room(room_jid);

    if room_jid == main_room_jid then
        return;
    end

    if main_room then
        if main_room._data.breakout_rooms then
            main_room._data.breakout_rooms[room_jid] = name;
            local breakout_room = breakout_rooms_muc_service.get_room_from_jid(room_jid);

            if breakout_room then
                breakout_room:set_subject(breakout_room.jid, name);
            end

        end
        main_room:save(true);
        broadcast_breakout_rooms(main_room_jid);
    end
end

-- Handling events

function on_message(event)
    local session = event.origin;

    -- Check the type of the incoming stanza to avoid loops:
    if event.stanza.attr.type == 'error' then
        return; -- We do not want to reply to these, so leave.
    end

    if not session or not session.jitsi_web_query_room then
        return false;
    end

    local message = event.stanza:get_child(BREAKOUT_ROOMS_IDENTITY_TYPE);

    if not message then
        return false;
    end

    -- get room name with tenant and find room
    local room = get_room_by_name_and_subdomain(session.jitsi_web_query_room, session.jitsi_web_query_prefix);

    if not room then
        module:log('warn', 'No room found for %s/%s',
                session.jitsi_web_query_prefix, session.jitsi_web_query_room);
        return false;
    end

    -- check that the participant requesting is a moderator and is an occupant in the room
    local from = event.stanza.attr.from;
    local occupant = room:get_occupant_by_real_jid(from);

    if not occupant then
        -- Check if the participant is in any breakout room.
        for breakout_room_jid in pairs(room._data.breakout_rooms or {}) do
            local breakout_room = breakout_rooms_muc_service.get_room_from_jid(breakout_room_jid);
            if breakout_room then
                occupant = breakout_room:get_occupant_by_real_jid(from);
                if occupant then
                    break;
                end
            end
        end
        if not occupant then
            module:log('warn', 'No occupant %s found for %s', from, room.jid);
            return false;
        end
    end

    if occupant.role ~= 'moderator' then
        module:log('warn', 'Occupant %s is not moderator and not allowed this operation for %s', from, room.jid);
        return false;
    end

    if message.attr.type == JSON_TYPE_ADD_BREAKOUT_ROOM then
        create_breakout_room(room.jid, message.attr.subject);
        return true;
    elseif message.attr.type == JSON_TYPE_REMOVE_BREAKOUT_ROOM then
        destroy_breakout_room(message.attr.breakoutRoomJid);
        return true;
    elseif message.attr.type == JSON_TYPE_RENAME_BREAKOUT_ROOM then
        rename_breakout_room(message.attr.breakoutRoomJid, message.attr.subject);
        return true;
    elseif message.attr.type == JSON_TYPE_MOVE_TO_ROOM_REQUEST then
        local participant_jid = message.attr.participantJid;
        local target_room_jid = message.attr.roomJid;

        local json_msg = json.encode({
            type = BREAKOUT_ROOMS_IDENTITY_TYPE,
            event = JSON_TYPE_MOVE_TO_ROOM_REQUEST,
            roomJid = target_room_jid
        });

        send_json_msg(participant_jid, json_msg)
        return true;
    end

    -- return error.
    return false;
end

function on_breakout_room_pre_create(event)
    local breakout_room = event.room;
    local main_room, main_room_jid = get_main_room(breakout_room.jid);

    -- Only allow existent breakout rooms to be started.
    -- Authorisation of breakout rooms is done by their random uuid name
    if main_room and main_room._data.breakout_rooms and main_room._data.breakout_rooms[breakout_room.jid] then
        breakout_room:set_subject(breakout_room.jid, main_room._data.breakout_rooms[breakout_room.jid]);
    else
        module:log('debug', 'Invalid breakout room %s will not be created.', breakout_room.jid);
        breakout_room:destroy(main_room_jid, 'Breakout room is invalid.');
        return true;
    end
end

function on_occupant_joined(event)
    local room = event.room;

    if is_healthcheck_room(room.jid) then
        return;
    end

    local main_room, main_room_jid = get_main_room(room.jid);

    if main_room and main_room._data.breakout_rooms_active then
        if jid_node(event.occupant.jid) ~= 'focus' then
            broadcast_breakout_rooms(main_room_jid);
        end

        -- Prevent closing all rooms if a participant has joined (see on_occupant_left).
        if main_room.close_timer then
            main_room.close_timer:stop();
            main_room.close_timer = nil;
        end
    end
end

function exist_occupants_in_room(room)
    if not room then
        return false;
    end
    for _, occupant in room:each_occupant() do
        if jid_node(occupant.jid) ~= 'focus' then
            return true;
        end
    end

    return false;
end

function exist_occupants_in_rooms(main_room)
    if exist_occupants_in_room(main_room) then
        return true;
    end
    for breakout_room_jid in pairs(main_room._data.breakout_rooms or {}) do
        local room = breakout_rooms_muc_service.get_room_from_jid(breakout_room_jid);
        if exist_occupants_in_room(room) then
            return true;
        end
    end

    return false;
end

function on_occupant_left(event)
    local room_jid = event.room.jid;

    if is_healthcheck_room(room_jid) then
        return;
    end

    local main_room, main_room_jid = get_main_room(room_jid);

    if not main_room then
        return;
    end

    if main_room._data.breakout_rooms_active and jid_node(event.occupant.jid) ~= 'focus' then
        broadcast_breakout_rooms(main_room_jid);
    end

    -- Close the conference if all left for good.
    if main_room._data.breakout_rooms_active and not main_room.close_timer and not exist_occupants_in_rooms(main_room) then
        main_room.close_timer = module:add_timer(ROOMS_TTL_IF_ALL_LEFT, function()
            -- we need to look up again the room as till the timer is fired, the room maybe already destroyed/recreated
            -- and we will have the old instance
            local main_room, main_room_jid = get_main_room(room_jid);
            if main_room and main_room.close_timer then
                module:log('info', 'Closing conference %s as all left for good.', main_room_jid);
                main_room:set_persistent(false);
                main_room:destroy(nil, 'All occupants left.');
            end
        end);
    end
end

function on_main_room_destroyed(event)
    local main_room = event.room;

    if is_healthcheck_room(main_room.jid) then
        return;
    end

    for breakout_room_jid in pairs(main_room._data.breakout_rooms or {}) do
        destroy_breakout_room(breakout_room_jid, event.reason)
    end
end


-- Module operations

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


-- operates on already loaded breakout rooms muc module
function process_breakout_rooms_muc_loaded(breakout_rooms_muc, host_module)
    module:log('debug', 'Breakout rooms muc loaded');

    -- Advertise the breakout rooms component so clients can pick up the address and use it
    module:add_identity('component', BREAKOUT_ROOMS_IDENTITY_TYPE, breakout_rooms_muc_component_config);

    -- Tag the disco#info response with available features of breakout rooms.
    host_module:hook('host-disco-info-node', function (event)
        local session, reply, node = event.origin, event.reply, event.node;
        if node == BREAKOUT_ROOMS_IDENTITY_TYPE and session.jitsi_web_query_room then
            reply:tag('feature', { var = RENAME_FEATURE }):up();
        end
        event.exists = true;
    end);

    breakout_rooms_muc_service = breakout_rooms_muc;
    module:log("info", "Hook to muc events on %s", breakout_rooms_muc_component_config);
    host_module:hook('message/host', on_message);
    host_module:hook('muc-occupant-joined', on_occupant_joined);
    host_module:hook('muc-occupant-left', on_occupant_left);
    host_module:hook('muc-room-pre-create', on_breakout_room_pre_create);

    host_module:hook('muc-disco#info', function (event)
        local room = event.room;
        local main_room, main_room_jid = get_main_room(room.jid);

        -- Breakout room metadata.
        table.insert(event.form, {
            name = 'muc#roominfo_isbreakout';
            label = 'Is this a breakout room?';
            type = "boolean";
        });
        event.formdata['muc#roominfo_isbreakout'] = true;
        table.insert(event.form, {
            name = 'muc#roominfo_breakout_main_room';
            label = 'The main room associated with this breakout room';
        });
        event.formdata['muc#roominfo_breakout_main_room'] = main_room_jid;

        -- If the main room has a lobby, make it so this breakout room also uses it.
        if (main_room and main_room._data.lobbyroom and main_room:get_members_only()) then
            table.insert(event.form, {
                name = 'muc#roominfo_lobbyroom';
                label = 'Lobby room jid';
            });
            event.formdata['muc#roominfo_lobbyroom'] = main_room._data.lobbyroom;
        end
    end);

    host_module:hook("muc-config-form", function(event)
        local room = event.room;
        local _, main_room_jid = get_main_room(room.jid);

        -- Breakout room metadata.
        table.insert(event.form, {
            name = 'muc#roominfo_isbreakout';
            label = 'Is this a breakout room?';
            type = "boolean";
            value = true;
        });

        table.insert(event.form, {
            name = 'muc#roominfo_breakout_main_room';
            label = 'The main room associated with this breakout room';
            value = main_room_jid;
        });
    end);

    local room_mt = breakout_rooms_muc_service.room_mt;

    room_mt.get_members_only = function(room)
        local main_room = get_main_room(room.jid);

        if not main_room then
            module:log('error', 'No main room (%s)!', room.jid);
            return false;
        end

        return main_room.get_members_only(main_room)
    end

    -- we base affiliations (roles) in breakout rooms muc component to be based on the roles in the main muc
    room_mt.get_affiliation = function(room, jid)
        local main_room, _ = get_main_room(room.jid);

        if not main_room then
            module:log('error', 'No main room(%s) for %s!', room.jid, jid);
            return 'none';
        end

        -- moderators in main room are moderators here
        local role = main_room.get_affiliation(main_room, jid);
        if role then
            return role;
        end

        return 'none';
    end
end

-- process or waits to process the breakout rooms muc component
process_host_module(breakout_rooms_muc_component_config, function(host_module, host)
    module:log('info', 'Breakout rooms component created %s', host);

    local muc_module = prosody.hosts[host].modules.muc;

    if muc_module then
        process_breakout_rooms_muc_loaded(muc_module, host_module);
    else
        module:log('debug', 'Will wait for muc to be available');
        prosody.hosts[host].events.add_handler('module-loaded', function(event)
            if (event.module == 'muc') then
                process_breakout_rooms_muc_loaded(prosody.hosts[host].modules.muc, host_module);
            end
        end);
    end
end);

-- operates on already loaded main muc module
function process_main_muc_loaded(main_muc, host_module)
    module:log('debug', 'Main muc loaded');

    main_muc_service = main_muc;
    module:log("info", "Hook to muc events on %s", main_muc_component_config);
    host_module:hook('muc-occupant-joined', on_occupant_joined);
    host_module:hook('muc-occupant-left', on_occupant_left);
    host_module:hook('muc-room-destroyed', on_main_room_destroyed);
end

-- process or waits to process the main muc component
process_host_module(main_muc_component_config, function(host_module, host)
    local muc_module = prosody.hosts[host].modules.muc;

    if muc_module then
        process_main_muc_loaded(muc_module, host_module);
    else
        module:log('debug', 'Will wait for muc to be available');
        prosody.hosts[host].events.add_handler('module-loaded', function(event)
            if (event.module == 'muc') then
                process_main_muc_loaded(prosody.hosts[host].modules.muc, host_module);
            end
        end);
    end
end);
