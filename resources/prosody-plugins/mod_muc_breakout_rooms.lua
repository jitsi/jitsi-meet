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
--     modules_enabled = {
--         "muc_meeting_id";
--         "muc_domain_mapper";
--         --"token_verification";
--     }
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

module:depends('jitsi_session');

local jid_bare = require 'util.jid'.bare;
local jid_split = require 'util.jid'.split;
local json = require 'util.json';
local st = require 'util.stanza';
local timer = require 'util.timer';
local uuid_gen = require 'util.uuid'.generate;

local BROADCAST_ROOMS_INTERVAL = 1;
local ROOMS_TTL_IF_ALL_LEFT = 5;
local JSON_TYPE_ADD_BREAKOUT_ROOM = 'features/breakout-rooms/add';
local JSON_TYPE_MOVE_TO_ROOM_REQUEST = 'features/breakout-rooms/move-to-room-request';
local JSON_TYPE_REMOVE_BREAKOUT_ROOM = 'features/breakout-rooms/remove';
local JSON_TYPE_UPDATE_BREAKOUT_ROOMS = 'features/breakout-rooms/update';

local main_muc_component_config = module:get_option_string('main_muc');
if main_muc_component_config == nil then
    module:log('error', 'breakout rooms not enabled missing main_muc config');
    return ;
end
local breakout_rooms_muc_component_config = module:get_option_string('breakout_rooms_muc');
if breakout_rooms_muc_component_config == nil then
    module:log('error', 'breakout rooms not enabled missing breakout_rooms_muc config');
    return ;
end

local breakout_rooms_muc_service;
local main_muc_service;


-- Utility functions

function get_main_room_jid(room_jid)
    local node, host = jid_split(room_jid);
    local breakout_room_suffix_index = node:find('_[-%x]+$');

	return
        host == main_muc_component_config
        and room_jid
        or node:sub(1, breakout_room_suffix_index - 1) .. '@' .. main_muc_component_config;
end

function get_main_room(room_jid)
    local main_room_jid = get_main_room_jid(room_jid);

    return main_muc_service.get_room_from_jid(main_room_jid), main_room_jid;
end

function get_room_from_jid(room_jid)
    local _, host = jid_split(room_jid);

    return
        host == main_muc_component_config
        and main_muc_service.get_room_from_jid(room_jid)
        or breakout_rooms_muc_service.get_room_from_jid(room_jid);
end

function get_focus_jid(room_jid)
    local _, host = jid_split(room_jid);

    return jid_split(room_jid) .. '@' .. host .. '/focus'
end

function send_json_msg(room, to, json_msg)
    if room and to then
        local focus = get_focus_jid(room.jid);

        room:route_to_occupant(to,
            st.message({ type = 'chat', from = focus })
                :tag('json-message', {xmlns='http://jitsi.org/jitmeet'})
                :text(json_msg):up());
    end
end

function broadcast_json_msg(room, json_msg)
    if room then
        local focus = get_focus_jid(room.jid);

        room:broadcast_message(
            st.message({ type = 'groupchat', from = focus })
                :tag('json-message', {xmlns='http://jitsi.org/jitmeet'})
                :text(json_msg):up());
    end
end

function get_participants(room)
    local participants = {};

    if room then
        for nick, occupant in room:each_occupant() do
            -- filter focus as we keep it as hidden participant
            if jid_split(occupant.jid) ~= 'focus' then
                local display_name = occupant:get_presence():get_child_text(
                    'nick', 'http://jabber.org/protocol/nick');
                participants[nick] = {
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
    local main_room, main_room_jid = get_main_room(room_jid);

    if not main_room or main_room._data.is_broadcast_breakout_scheduled then
        return;
    end
    -- Only send each BROADCAST_ROOMS_INTERVAL seconds
    -- to prevent flooding of messages.
    main_room._data.is_broadcast_breakout_scheduled = true;
    main_room:save(true);
    timer.add_task(BROADCAST_ROOMS_INTERVAL, function()
        main_room._data.is_broadcast_breakout_scheduled = false;
        main_room:save(true);

        local main_room_id = jid_split(main_room_jid)
        local rooms = {
            [main_room_id] = {
                isMainRoom = true,
                id = main_room_id,
                jid = main_room_jid,
                name = main_room._data.subject,
                participants = get_participants(main_room)
            };
        }

        for breakout_room_jid, subject in pairs(main_room._data.breakout_rooms or {}) do
            local breakout_room = breakout_rooms_muc_service.get_room_from_jid(breakout_room_jid);
            local breakout_room_id = jid_split(breakout_room_jid)

            rooms[breakout_room_id] = {
                id = breakout_room_id,
                jid = breakout_room_jid,
                name = subject
            }
            if breakout_room then
                rooms[breakout_room_id].participants = get_participants(breakout_room);
            end
        end

        local json_msg = json.encode({
            type = JSON_TYPE_UPDATE_BREAKOUT_ROOMS,
            nextIndex = main_room._data.next_index,
            rooms = rooms
        });

        broadcast_json_msg(main_room, json_msg);
        for breakout_room_jid, breakout_room in pairs(main_room._data.breakout_rooms or {}) do
            local room = breakout_rooms_muc_service.get_room_from_jid(breakout_room_jid);
            if room then
                broadcast_json_msg(room, json_msg);
            end
        end
    end);
end


-- Managing breakout rooms

function create_breakout_room(room_jid, from, subject, next_index)
    local main_room, main_room_jid = get_main_room(room_jid);
    local node = jid_split(main_room_jid);
    local breakout_room_jid = node .. '_' .. uuid_gen() .. '@' .. breakout_rooms_muc_component_config;

    if not main_room._data.breakout_rooms then
        main_room._data.breakout_rooms = {};
    end
    main_room._data.breakout_rooms[breakout_room_jid] = subject;
    main_room._data.next_index = next_index;
    -- Make room persistent - not to be destroyed - if all participants moved to breakout rooms.
    main_room:set_persistent(true);
    main_room:save(true);
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
        breakout_room:destroy(main_room_jid, message);
    end
    if main_room then
        if main_room._data.breakout_rooms then
            main_room._data.breakout_rooms[room_jid] = nil;
        end
        main_room:save(true);
        broadcast_breakout_rooms(main_room_jid);
    end
end


-- Handling events

function handle_json_chat_messages(event)
    local origin, stanza = event.origin, event.stanza;
	local type = stanza.attr.type;

    if type ~= 'chat' then
        return;
    end

    local json_message = stanza:get_child('json-message', 'http://jitsi.org/jitmeet');
    local message = json_message and json.decode(json_message:get_text());

    if not message then
        return;
    end

    local room_jid = jid_bare(stanza.attr.to);
    local room = get_room_from_jid(room_jid);
    local main_room_jid = get_main_room_jid(room_jid);
    local from = stanza.attr.from;

    if message.type == JSON_TYPE_ADD_BREAKOUT_ROOM then
        if room and room.get_affiliation(room, from) == 'owner' then
            create_breakout_room(main_room_jid, origin, message.subject, message.nextIndex);
        end
        return true;
    elseif message.type == JSON_TYPE_REMOVE_BREAKOUT_ROOM then
        if room and room.get_affiliation(room, from) == 'owner' then
            destroy_breakout_room(message.breakoutRoomJid);
        end
        return true;
    elseif message.type == JSON_TYPE_MOVE_TO_ROOM_REQUEST then
        if room and room.get_affiliation(room, from) == 'owner' then
            local _, _, participant_nick = jid_split(stanza.attr.to);
            local participant_room_jid = jid_bare(participant_nick);
            local participant_room = get_room_from_jid(participant_room_jid);
            local occupant = participant_room:get_occupant_by_nick(participant_nick);

            send_json_msg(participant_room, occupant, json_message:get_text());
        end
        return true;
    end
    return;
end

function handle_breakout_room_pre_create(event)
    local room = event.room;
    local main_room, main_room_jid = get_main_room(room.jid);

    if main_room and main_room._data.breakout_rooms then
        room._data.subject = main_room._data.breakout_rooms[room.jid];
        room.save();
    else
        module:log('info', 'Invalid breakout room %s will not be created.', room.jid);
        room:destroy(main_room_jid, 'Breakout room is invalid.');
        return true;
    end
end

function handle_occupant_joined(event)
    local room = event.room;
    local main_room = get_main_room(room.jid);

    if jid_split(event.occupant.jid) ~= 'focus' then
        broadcast_breakout_rooms(room.jid);
    end

    -- Prevent closing all rooms if a participant has joined.
    if (main_room._data.is_close_all_scheduled) then
        main_room._data.is_close_all_scheduled = false;
        main_room:save();
    end
end

function exist_occupants_in_room(room)
    if not room then
        return false;
    end
    for occupant_jid, occupant in room:each_occupant() do
        if jid_split(occupant.jid) ~= 'focus' then
            return true;
        end
    end

    return false;
end

function exist_occupants_in_rooms(main_room)
    if exist_occupants_in_room(main_room) then
        return true;
    end
    for breakout_room_jid, breakout_room in pairs(main_room._data.breakout_rooms or {}) do
        local room = breakout_rooms_muc_service.get_room_from_jid(breakout_room_jid);
        if exist_occupants_in_room(room) then
            return true;
        end
    end

    return false;
end

function handle_occupant_left(event)
    local room = event.room;
    local main_room, main_room_jid = get_main_room(room.jid);

    if jid_split(event.occupant.jid) ~= 'focus' then
        broadcast_breakout_rooms(room.jid);
    end

    -- Close the conference if all left for good.
    if not exist_occupants_in_rooms(main_room) then
        main_room._data.is_close_all_scheduled = true;
        main_room:save(true);
        timer.add_task(ROOMS_TTL_IF_ALL_LEFT, function()
            if main_room._data.is_close_all_scheduled then
                module:log('debug', 'Closing conference %s as all left for good.', main_room_jid);
                main_room:set_persistent(false);
                main_room:save(true);
                main_room:destroy(main_room_jid, 'All occupants left.');
            end
        end)
    end
end

function handle_main_room_destroyed(event)
    local main_room = event.room;
    local message = 'Conference ended.';

    for breakout_room_jid, breakout_room in pairs(main_room._data.breakout_rooms or {}) do
        destroy_breakout_room(breakout_room_jid, message)
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

    breakout_rooms_muc_service = breakout_rooms_muc;
    host_module:hook('message/full', handle_json_chat_messages);
    host_module:hook('muc-occupant-joined', handle_occupant_joined);
    host_module:hook('muc-occupant-left', handle_occupant_left);
    host_module:hook('muc-room-pre-create', handle_breakout_room_pre_create);

    host_module:hook('muc-disco#info', function (event)
        local room = event.room;
        local main_room = get_main_room(room.jid);

        if (main_room._data.lobbyroom and main_room:get_members_only()) then
            table.insert(event.form, {
                name = 'muc#roominfo_lobbyroom';
                label = 'Lobby room jid';
                value = '';
            });
            event.formdata['muc#roominfo_lobbyroom'] = main_room._data.lobbyroom;
        end
    end);

    local room_mt = breakout_rooms_muc_service.room_mt;

    room_mt.get_members_only = function(room)
        local main_room = get_main_room(room.jid);

        return main_room.get_members_only(main_room)
    end

    -- we base affiliations (roles) in breakout rooms muc component to be based on the roles in the main muc
    room_mt.get_affiliation = function(room, jid)
        local main_room, main_room_jid = get_main_room(room.jid);

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
    host_module:hook('message/full', handle_json_chat_messages);
    host_module:hook('muc-occupant-joined', handle_occupant_joined);
    host_module:hook('muc-occupant-left', handle_occupant_left);
    host_module:hook('muc-room-destroyed', handle_main_room_destroyed);
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
