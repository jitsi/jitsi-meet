local jid_bare = require 'util.jid'.bare;
local jid_split = require 'util.jid'.split;
local json = require 'util.json';
local st = require 'util.stanza';
local uuid_gen = require 'util.uuid'.generate;

local get_room_from_jid = module:require "util".get_room_from_jid;

local BROADCAST_ROOMS_INTERVAL = .3;
local ROOMS_TTL_IF_ALL_LEFT = 5;
local JSON_TYPE_ADD_BREAKOUT_ROOM = 'features/breakout-rooms/add';
local JSON_TYPE_MOVE_TO_ROOM_REQUEST = 'features/breakout-rooms/move-to-room-request';
local JSON_TYPE_REMOVE_BREAKOUT_ROOM = 'features/breakout-rooms/remove';
local JSON_TYPE_UPDATE_BREAKOUT_ROOMS = 'features/breakout-rooms/update';
local BREAKOUT_ROOMS_SUFFIX_PATTERN = '#breakout_[-%x]+$';

local main_muc_component_config = module:get_option_string('main_muc');
if main_muc_component_config == nil then
    module:log('error', 'breakout rooms not enabled missing main_muc config');
    return ;
end


-- Utility functions

function get_main_room_jid(room_jid)
    local node, host = jid_split(room_jid);
    local from_index, to_index = node:find(BREAKOUT_ROOMS_SUFFIX_PATTERN);

	return from_index and node:sub(1, from_index - 1) .. room_jid:sub(to_index + 1) or room_jid
end

function get_main_room(room_jid)
    local main_room_jid = get_main_room_jid(room_jid);

    return get_room_from_jid(main_room_jid), main_room_jid;
end

function send_json_msg(room, to, json_msg)
    if room and to then
        room:route_to_occupant(to,
            st.message({ type = 'chat', from = room.jid .. '/focus' })
                :tag('json-message', {xmlns='http://jitsi.org/jitmeet'})
                :text(json_msg):up());
    end
end

function broadcast_json_msg(room, json_msg)
    if room then
        room:broadcast_message(
            st.message({ type = 'groupchat', from = room.jid .. '/focus' })
                :tag('json-message', {xmlns='http://jitsi.org/jitmeet'})
                :text(json_msg):up());
    end
end

function get_participants(room)
    local participants = {};

    if room then
        for nick, occupant in room:each_occupant() do
            -- Filter focus as we keep it as a hidden participant
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

    -- Only send each BROADCAST_ROOMS_INTERVAL seconds to prevent flooding of messages.
    main_room._data.is_broadcast_breakout_scheduled = true;
    main_room:save(true);
    module:add_timer(BROADCAST_ROOMS_INTERVAL, function()
        main_room._data.is_broadcast_breakout_scheduled = false;
        main_room:save(true);

        local main_room_node = jid_split(main_room_jid)
        local rooms = {
            [main_room_node] = {
                isMainRoom = true,
                id = main_room_node,
                jid = main_room_jid,
                name = main_room._data.subject,
                participants = get_participants(main_room)
            };
        }

        for breakout_room_jid, subject in pairs(main_room._data.breakout_rooms or {}) do
            local breakout_room = get_room_from_jid(breakout_room_jid);
            local breakout_room_node = jid_split(breakout_room_jid)

            rooms[breakout_room_node] = {
                id = breakout_room_node,
                jid = breakout_room_jid,
                name = subject
            }
            if breakout_room then
                rooms[breakout_room_node].participants = get_participants(breakout_room);
            end
        end

        local json_msg = json.encode({
            type = JSON_TYPE_UPDATE_BREAKOUT_ROOMS,
            nextIndex = main_room._data.next_index,
            rooms = rooms
        });

        broadcast_json_msg(main_room, json_msg);
        for breakout_room_jid, breakout_room in pairs(main_room._data.breakout_rooms or {}) do
            local room = get_room_from_jid(breakout_room_jid);
            if room then
                broadcast_json_msg(room, json_msg);
            end
        end
    end);
end


-- Managing breakout rooms

function create_breakout_room(room_jid, from, subject, next_index)
    local main_room, main_room_jid = get_main_room(room_jid);
    local node, host = jid_split(main_room_jid);
    -- Breakout rooms are named like the main room with a random uuid suffix
    local breakout_room_jid = node .. '#breakout_' .. uuid_gen() .. '@' .. host;

    if not main_room._data.breakout_rooms then
        main_room._data.breakout_rooms = {};
    end
    main_room._data.breakout_rooms[breakout_room_jid] = subject;
    main_room._data.next_index = next_index;
    -- Make room persistent - not to be destroyed - if all participants join breakout rooms.
    main_room:set_persistent(true);
    main_room:save(true);
    broadcast_breakout_rooms(main_room_jid);
end

function destroy_breakout_room(room_jid, message)
    local main_room, main_room_jid = get_main_room(room_jid);

    if room_jid == main_room_jid then
        return;
    end

    local breakout_room = get_room_from_jid(room_jid);

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

function on_message(event)
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

function on_room_pre_create(event)
    local room = event.room;
    local main_room, main_room_jid = get_main_room(room.jid);

    if room.jid == main_room_jid then
        return;
    end

    -- Only allow existent breakout rooms to be started.
    -- Authorisation of breakout rooms is done by their random uuid suffix
    if main_room and main_room._data.breakout_rooms and main_room._data.breakout_rooms[room.jid] then
        room._data.subject = main_room._data.breakout_rooms[room.jid];
        room.save();
    else
        module:log('debug', 'Invalid breakout room %s will not be created.', room.jid);
        room:destroy(main_room_jid, 'Breakout room is invalid.');
        return true;
    end
end

function on_occupant_joined(event)
    local room = event.room;
    local main_room = get_main_room(room.jid);

    if jid_split(event.occupant.jid) ~= 'focus' then
        broadcast_breakout_rooms(room.jid);
    end

    -- Prevent closing all rooms if a participant has joined (see on_occupant_left).
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
        local room = get_room_from_jid(breakout_room_jid);
        if exist_occupants_in_room(room) then
            return true;
        end
    end

    return false;
end

function on_occupant_left(event)
    local room = event.room;
    local main_room, main_room_jid = get_main_room(room.jid);

    if jid_split(event.occupant.jid) ~= 'focus' then
        broadcast_breakout_rooms(room.jid);
    end

    -- Close the conference if all left for good.
    if not main_room._data.is_close_all_scheduled and not exist_occupants_in_rooms(main_room) then
        main_room._data.is_close_all_scheduled = true;
        main_room:save(true);
        module:add_timer(ROOMS_TTL_IF_ALL_LEFT, function()
            if main_room._data.is_close_all_scheduled then
                module:log('info', 'Closing conference %s as all left for good.', main_room_jid);
                main_room:set_persistent(false);
                main_room:save(true);
                main_room:destroy(main_room_jid, 'All occupants left.');
            end
        end)
    end
end

function on_room_destroyed(event)
    local main_room = event.room;
    local message = 'Conference ended.';

    for breakout_room_jid, breakout_room in pairs(main_room._data.breakout_rooms or {}) do
        destroy_breakout_room(breakout_room_jid, message)
    end
end


-- Module operations

function process_main_muc_loaded(muc_module, host_module)
    local host_module = module:context(main_muc_component_config);
    local room_mt = muc_module.room_mt;

    module:log("info", "Hook to muc events on %s", main_muc_component_config);
    host_module:hook('message/full', on_message);
    host_module:hook('muc-occupant-joined', on_occupant_joined);
    host_module:hook('muc-occupant-left', on_occupant_left);
    host_module:hook('muc-room-destroyed', on_room_destroyed);
    host_module:hook('muc-room-pre-create', on_room_pre_create);

    room_mt.get_members_only_origin = room_mt.get_members_only;
    room_mt.get_members_only = function(room)
        local main_room = get_main_room(room.jid);

        return room_mt.get_members_only_origin(main_room or room);
    end

    room_mt.get_lobby = function(room)
        local main_room = get_main_room(room.jid);

        return (main_room or room)._data.lobbyroom;
    end

    -- Affiliations (roles) in breakout rooms are based on the roles in the main room.
    room_mt.get_affiliation_origin = room_mt.get_affiliation;
    room_mt.get_affiliation = function(room, jid)
        local main_room, main_room_jid = get_main_room(room.jid);
        local role = room_mt.get_affiliation_origin(main_room or room, jid);

        if role then
            return role;
        end

        return 'none';
    end
end

function process_host(host)
    if host ~= main_muc_component_config then
        return;
    end

    module:log('info', 'Main muc component loaded %s', host);

    local muc_module = prosody.hosts[host].modules.muc;
    if muc_module then
        process_main_muc_loaded(muc_module);
    else
        module:log('debug', 'Will wait for muc to be available');
        prosody.hosts[host].events.add_handler('module-loaded', function(event)
            if (event.module == 'muc') then
                process_main_muc_loaded(prosody.hosts[host].modules.muc);
            end
        end);
    end
end

if prosody.hosts[main_muc_component_config] == nil then
    module:log("info", "No muc component found, will listen for it: %s", main_muc_component_config)
    prosody.events.add_handler("host-activated", process_host);
else
    process_host(main_muc_component_config);
end
