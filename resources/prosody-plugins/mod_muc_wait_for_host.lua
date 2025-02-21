-- This module is activated under the main muc component
-- This will prevent anyone joining the call till jicofo and one moderator join the room
-- for the rest of the participants lobby will be turned on and they will be waiting there till
-- the main participant joins and lobby will be turned off at that time and rest of the participants will
-- join the room. It expects main virtual host to be set to require jwt tokens and guests to use
-- the guest domain which is anonymous.
-- The module has the option to set participants to moderators when connected via token/when they are authenticated
-- This module depends on mod_persistent_lobby.
local jid = require 'util.jid';
local util = module:require "util";
local is_admin = util.is_admin;
local is_healthcheck_room = util.is_healthcheck_room;
local is_moderated = util.is_moderated;
local process_host_module = util.process_host_module;

local disable_auto_owners = module:get_option_boolean('wait_for_host_disable_auto_owners', false);

local muc_domain_base = module:get_option_string('muc_mapper_domain_base');
if not muc_domain_base then
    module:log('warn', "No 'muc_mapper_domain_base' option set, disabling muc_mapper plugin inactive");
    return
end

-- to activate this you need the following config in general config file in log = { }
-- { to = 'file', filename = '/var/log/prosody/prosody.audit.log', levels = { 'audit' }  }
local logger = require 'util.logger';
local audit_logger = logger.make_logger('mod_'..module.name, 'audit');

local lobby_muc_component_config = 'lobby.' .. muc_domain_base;
local lobby_host;

if not disable_auto_owners then
    module:hook('muc-occupant-joined', function (event)
        local room, occupant, session = event.room, event.occupant, event.origin;
        local is_moderated_room = is_moderated(room.jid);

        -- for jwt authenticated and username and password authenticated
        -- only if it is not a moderated room
        if not is_moderated_room and
            (session.auth_token or (session.username and jid.host(occupant.bare_jid) == muc_domain_base)) then
            room:set_affiliation(true, occupant.bare_jid, 'owner');
        end
    end, 2);
end

-- if not authenticated user is trying to join the room we enable lobby in it
-- and wait for the moderator to join
module:hook('muc-occupant-pre-join', function (event)
    local room, occupant, session = event.room, event.occupant, event.origin;

    -- we ignore jicofo as we want it to join the room or if the room has already seen its
    -- authenticated host
    if is_admin(occupant.bare_jid) or is_healthcheck_room(room.jid) or room.has_host then
        return;
    end

    local has_host = false;
    for _, o in room:each_occupant() do
        if jid.host(o.bare_jid) == muc_domain_base then
            room.has_host = true;
        end
    end

    if not room.has_host then
        if session.auth_token or (session.username and jid.host(occupant.bare_jid) == muc_domain_base) then
            -- the host is here, let's drop the lobby
            room:set_members_only(false);

            -- let's set the default role of 'participant' for the newly created occupant as it was nil when created
            -- when the room was still members_only, later if not disabled this participant will become a moderator
            occupant.role = room:get_default_role(room:get_affiliation(occupant.bare_jid)) or 'participant';

            module:log('info', 'Host %s arrived in %s.', occupant.bare_jid, room.jid);
            audit_logger('room_jid:%s created_by:%s', room.jid,
                session.jitsi_meet_context_user and session.jitsi_meet_context_user.id or 'nil');
            module:fire_event('room_host_arrived', room.jid, session);
            lobby_host:fire_event('destroy-lobby-room', {
                room = room,
                newjid = room.jid,
                message = 'Host arrived.',
            });
        elseif not room:get_members_only() then
            -- let's enable lobby
            module:log('info', 'Will wait for host in %s.', room.jid);
            prosody.events.fire_event('create-persistent-lobby-room', {
                room = room;
                reason = 'waiting-for-host',
                skip_display_name_check = true;
            });
        end
    end
end);

process_host_module(lobby_muc_component_config, function(host_module, host)
    -- lobby muc component created
    module:log('info', 'Lobby component loaded %s', host);
    lobby_host = module:context(host_module);
end);
