-- Allows flipping device. When a presence contains flip_device tag
-- and the used jwt matches the id(session.jitsi_meet_context_user.id) of another user this is indication that the user
-- is moving from one device to another. The flip feature should be present and enabled in the token features.
-- Copyright (C) 2023-present 8x8, Inc.

local oss_util = module:require "util";
local is_admin = oss_util.is_admin;
local is_healthcheck_room = oss_util.is_healthcheck_room;
local process_host_module = oss_util.process_host_module;
local inspect = require('inspect');
local jid_bare = require "util.jid".bare;
local jid = require "util.jid";
local MUC_NS = "http://jabber.org/protocol/muc";

local lobby_host;
local lobby_muc_service;

local lobby_muc_component_config = 'lobby.' .. module:get_option_string("muc_mapper_domain_base");
if lobby_muc_component_config == nil then
    module:log('error', 'lobby not enabled missing lobby_muc config');
    return ;
end

local function remove_flip_tag(stanza)
    stanza:maptags(function(tag)
        if tag and tag.name == "flip_device" then
            -- module:log("debug", "Removing %s tag from presence stanza!", tag.name);
            return nil;
        else
            return tag;
        end
    end)
end

-- Make user that switch devices bypass lobby or password.
-- A user is considered to join from another device if the
-- id from jwt is the same as another occupant and the presence
-- stanza has flip_device tag
module:hook("muc-occupant-pre-join", function(event)
    local room, occupant = event.room, event.occupant;
    local session = event.origin;
    local stanza = event.stanza;
    if is_healthcheck_room(room.jid) or is_admin(occupant.bare_jid) then
        return ;
    end
    local flip_device_tag = stanza:get_child("flip_device");
    if session.jitsi_meet_context_user and session.jitsi_meet_context_user.id then
        local participants = room._data.participants_details or {};
        local id = session.jitsi_meet_context_user.id;
        local first_device_occ_nick = participants[id];
        if flip_device_tag then
            if first_device_occ_nick and session.jitsi_meet_context_features.flip and (session.jitsi_meet_context_features.flip == true or session.jitsi_meet_context_features.flip == "true") then
                room._data.kicked_participant_nick = first_device_occ_nick;
                room._data.flip_participant_nick = occupant.nick;
                -- allow participant from flip device to bypass Lobby
                local occupant_jid = stanza.attr.from;
                local affiliation = room:get_affiliation(occupant_jid);
                if not affiliation or affiliation == 'none' or affiliation == 'member' then
                    -- module:log("debug", "Bypass lobby invitee %s", occupant_jid)
                    occupant.role = "participant";
                    room:set_affiliation(true, jid_bare(occupant_jid), "member")
                    room:save_occupant(occupant);
                end

                if room:get_password() then
                    -- bypass password on the flip device
                    local join = stanza:get_child("x", MUC_NS);
                    if not join then
                        join = stanza:tag("x", { xmlns = MUC_NS });
                    end
                    local password = join:get_child("password", MUC_NS);
                    if password then
                        join:maptags(
                                function(tag)
                                    for k, v in pairs(tag) do
                                        if k == "name" and v == "password" then
                                            return nil
                                        end
                                    end
                                    return tag
                                end);
                    end
                    join:tag("password", { xmlns = MUC_NS }):text(room:get_password());
                end
            elseif not session.jitsi_meet_context_features.flip or session.jitsi_meet_context_features.flip == false or session.jitsi_meet_context_features.flip == "false" then
                module:log("warn", "Flip device tag present without jwt permission")
                --remove flip_device tag if somebody wants to abuse this feature
                remove_flip_tag(stanza)
            else
                module:log("warn", "Flip device tag present without user from different device")
                --remove flip_device tag if somebody wants to abuse this feature
                remove_flip_tag(stanza)
            end
        end
        -- update authenticated participant list
        participants[id] = occupant.nick;
        room._data.participants_details = participants
        -- module:log("debug", "current details list %s", inspect(participants))
    else
        if flip_device_tag then
            module:log("warn", "Flip device tag present for a guest user")
            -- remove flip_device tag because a guest want to do a sneaky join
            remove_flip_tag(stanza)
        end
    end
end)

-- Kick participant from the the first device from the main room and lobby if applies
-- and transfer role from the previous participant, this will take care of the grant
-- moderation case
module:hook("muc-occupant-joined", function(event)
    local room, occupant = event.room, event.occupant;
    if is_healthcheck_room(room.jid) or is_admin(occupant.bare_jid) then
        return;
    end

    if room._data.flip_participant_nick and occupant.nick == room._data.flip_participant_nick then
        -- make joining participant from flip device have the same role and affiliation as for the previous device
        local kicked_occupant = room:get_occupant_by_nick(room._data.kicked_participant_nick);

        if not kicked_occupant then
            module:log("info", "Kick participant not found, nick %s from main room jid %s",
                room._data.kicked_participant_nick, room.jid)
            return;
        end

        local initial_affiliation = room:get_affiliation(kicked_occupant.jid) or "member";
        -- module:log("debug", "Transfer affiliation %s to occupant jid %s", initial_affiliation, occupant.jid)
        room:set_affiliation(true, occupant.bare_jid, initial_affiliation)
        if initial_affiliation == "owner" then
            event.occupant.role = "moderator";
        elseif initial_affiliation == "member" then
            event.occupant.role = "participant";
        end
        -- Kick participant from the first device from the main room
        local kicked_participant_node_jid = jid.split(kicked_occupant.jid);
        module:log("info", "Kick participant jid %s nick %s from main room jid %s", kicked_occupant.jid, room._data.kicked_participant_nick, room.jid)
        room:set_role(true, room._data.kicked_participant_nick, 'none')
        room:save_occupant(occupant);
        -- Kick participant from the first device from the lobby room
        if room._data.lobbyroom then
            local lobby_room_jid = room._data.lobbyroom;
            local lobby_room = lobby_muc_service.get_room_from_jid(lobby_room_jid)
            for _, occupant in lobby_room:each_occupant() do
                local node = jid.split(occupant.jid);
                if kicked_participant_node_jid == node then
                    module:log("info", "Kick participant from lobby %s", occupant.jid)
                    lobby_room:set_role(true, occupant.nick, 'none')
                end
            end
        end
        event.room._data.flip_participant_nick = nil
        event.room._data.kicked_participant_nick = nil;
    end
end,-2)

-- Update the local table after a participant leaves
module:hook("muc-occupant-left", function(event)
    local occupant = event.occupant;
    local session = event.origin;
    if is_healthcheck_room(event.room.jid) or is_admin(occupant.bare_jid) then
        return ;
    end
    if session and session.jitsi_meet_context_user and session.jitsi_meet_context_user.id then
        local id = session.jitsi_meet_context_user.id
        local participants = event.room._data.participants_details or {};
        local occupant_left_nick = participants[id]
        if occupant_left_nick == occupant.nick then
            participants[id] = nil
            event.room._data.participants_details = participants
        end
    end
end)

-- Add a flip_device tag on the unavailable presence from the kicked participant in order to silent the notifications
module:hook('muc-broadcast-presence', function(event)
    local kicked_participant_nick = event.room._data.kicked_participant_nick
    local stanza = event.stanza;
    if kicked_participant_nick and stanza.attr.from == kicked_participant_nick and stanza.attr.type == 'unavailable' then
        -- module:log("debug", "Add flip_device tag for presence unavailable from occupant nick %s", kicked_participant_nick)
        stanza:tag("flip_device"):up();
    end
end)

function process_lobby_muc_loaded(lobby_muc, host_module)
    module:log('info', 'Lobby muc loaded');
    lobby_muc_service = lobby_muc;
    lobby_host = module:context(host_module);
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
