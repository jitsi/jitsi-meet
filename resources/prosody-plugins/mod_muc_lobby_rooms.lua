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
-- Component "lobby.jitmeet.example.com" "muc"
--     storage = "memory"
--     muc_room_cache_size = 1000
--     restrict_room_creation = true
--     muc_room_locking = false
--     muc_room_default_public_jids = true
--
-- we use async to detect Prosody 0.10 and earlier
local have_async = pcall(require, 'util.async');

if not have_async then
    module:log('warn', 'Lobby rooms will not work with Prosody version 0.10 or less.');
    return;
end

module:depends("jitsi_session");

local jid_split = require 'util.jid'.split;
local jid_bare = require 'util.jid'.bare;
local jid_prep = require "util.jid".prep;
local jid_resource = require "util.jid".resource;
local resourceprep = require "util.encodings".stringprep.resourceprep;
local json = require 'cjson.safe';
local filters = require 'util.filters';
local st = require 'util.stanza';
local muc_util = module:require "muc/util";
local valid_affiliations = muc_util.valid_affiliations;
local MUC_NS = 'http://jabber.org/protocol/muc';
local MUC_USER_NS = 'http://jabber.org/protocol/muc#user';
local DISCO_INFO_NS = 'http://jabber.org/protocol/disco#info';
local DISPLAY_NAME_REQUIRED_FEATURE = 'http://jitsi.org/protocol/lobbyrooms#displayname_required';
local LOBBY_IDENTITY_TYPE = 'lobbyrooms';
local NOTIFY_JSON_MESSAGE_TYPE = 'lobby-notify';
local NOTIFY_LOBBY_ENABLED = 'LOBBY-ENABLED';
local NOTIFY_LOBBY_ACCESS_GRANTED = 'LOBBY-ACCESS-GRANTED';
local NOTIFY_LOBBY_ACCESS_DENIED = 'LOBBY-ACCESS-DENIED';

local util = module:require "util";
local ends_with = util.ends_with;
local get_room_by_name_and_subdomain = util.get_room_by_name_and_subdomain;
local is_healthcheck_room = util.is_healthcheck_room;
local presence_check_status = util.presence_check_status;
local process_host_module = util.process_host_module;

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

local whitelist;
local check_display_name_required;
local function load_config()
    whitelist = module:get_option_set('muc_lobby_whitelist', {});
    check_display_name_required
        = module:get_option_boolean('muc_lobby_check_display_name_required', true);
end
load_config();

local lobby_muc_service;
local main_muc_service;

function broadcast_json_msg(room, from, json_msg)
    json_msg.type = NOTIFY_JSON_MESSAGE_TYPE;

    local occupant = room:get_occupant_by_real_jid(from);
    if occupant then
        local json_msg_str, error = json.encode(json_msg);

        if not json_msg_str then
            module:log('error', 'Error broadcasting message room:%s', room.jid, error);
            return;
        end

        room:broadcast_message(
            st.message({ type = 'groupchat', from = occupant.nick })
              :tag('json-message', {xmlns='http://jitsi.org/jitmeet'})
              :text(json_msg_str):up());
    end
end

-- Sends a json message notifying for lobby enabled/disable
-- the message from is the actor that did the operation
function notify_lobby_enabled(room, actor, value)
    broadcast_json_msg(room, actor, {
        event = NOTIFY_LOBBY_ENABLED,
        value = value
    });
end

-- Sends a json message notifying that the jid was granted/denied access in lobby
-- the message from is the actor that did the operation
function notify_lobby_access(room, actor, jid, display_name, granted)
    local notify_json = {
        value = jid,
        name = display_name
    };
    if granted then
        notify_json.event = NOTIFY_LOBBY_ACCESS_GRANTED;
    else
        notify_json.event = NOTIFY_LOBBY_ACCESS_DENIED;
    end

    broadcast_json_msg(room, actor, notify_json);
end

function filter_stanza(stanza)
    if not stanza.attr or not stanza.attr.from or not main_muc_service or not lobby_muc_service then
        return stanza;
    end
    -- Allow self-presence (code=110)
    local node, from_domain = jid_split(stanza.attr.from);

    if from_domain == lobby_muc_component_config then
        if stanza.name == 'presence' then
            local muc_x = stanza:get_child('x', MUC_NS..'#user');
            if not muc_x or presence_check_status(muc_x, '110') then
                return stanza;
            end

            local lobby_room_jid = jid_bare(stanza.attr.from);
            local lobby_room = lobby_muc_service.get_room_from_jid(lobby_room_jid);
            if not lobby_room then
                module:log('warn', 'No lobby room found %s', lobby_room_jid);
                return stanza;
            end

            -- check is an owner, only owners can receive the presence
            -- do not forward presence of owners (other than unavailable)
            local room = main_muc_service.get_room_from_jid(jid_bare(node .. '@' .. main_muc_component_config));
            local item = muc_x:get_child('item');
            if not room
                or stanza.attr.type == 'unavailable'
                or (room.get_affiliation(room, stanza.attr.to) == 'owner'
                    and room.get_affiliation(room, item.attr.jid) ~= 'owner') then
                return stanza;
            end

            local is_to_moderator = lobby_room:get_affiliation(stanza.attr.to) == 'owner';
            local from_occupant = lobby_room:get_occupant_by_nick(stanza.attr.from);
            if not from_occupant then
                if is_to_moderator then
                    return stanza;
                end

                module:log('warn', 'No lobby occupant found %s', stanza.attr.from);
                return nil;
            end

            local from_real_jid;
            for real_jid in from_occupant:each_session() do
                from_real_jid = real_jid;
            end

            if is_to_moderator and lobby_room:get_affiliation(from_real_jid) ~= 'owner' then
                return stanza;
            end
        elseif stanza.name == 'iq' and stanza:get_child('query', DISCO_INFO_NS) then
            -- allow disco info from the lobby component
            return stanza;
        elseif stanza.name == 'message' then
            -- allow messages to or from moderator
            local lobby_room_jid = jid_bare(stanza.attr.from);
            local lobby_room = lobby_muc_service.get_room_from_jid(lobby_room_jid);

            if not lobby_room then
                module:log('warn', 'No lobby room found %s', stanza.attr.from);
                return nil;
            end

            local is_to_moderator = lobby_room:get_affiliation(stanza.attr.to) == 'owner';
            local from_occupant = lobby_room:get_occupant_by_nick(stanza.attr.from);

            local from_real_jid;
            if from_occupant then
                for real_jid in from_occupant:each_session() do
                    from_real_jid = real_jid;
                end
            end

            local is_from_moderator = lobby_room:get_affiliation(from_real_jid) == 'owner';

            if is_to_moderator or is_from_moderator then
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
    -- domain mapper is filtering on default priority 0, and we need it after that
    filters.add_filter(session, 'stanzas/out', filter_stanza, -1);
end

-- actor can be null if called from backend (another module using hook create-lobby-room)
function attach_lobby_room(room, actor)
    local node = jid_split(room.jid);
    local lobby_room_jid = node .. '@' .. lobby_muc_component_config;
    if not lobby_muc_service.get_room_from_jid(lobby_room_jid) then
        local new_room = lobby_muc_service.create_room(lobby_room_jid);
        -- set persistent the lobby room to avoid it to be destroyed
        -- there are cases like when selecting new moderator after the current one leaves
        -- which can leave the room with no occupants and it will be destroyed and we want to
        -- avoid lobby destroy while it is enabled
        new_room:set_persistent(true);
        module:log("info","Lobby room jid = %s created from:%s", lobby_room_jid, actor);
        new_room.main_room = room;
        room._data.lobbyroom = new_room.jid;
        room:save(true);
        return true
    end
    return false
end

-- destroys lobby room for the supplied main room
function destroy_lobby_room(room, newjid, message)
    if not message then
        message = 'Lobby room closed.';
    end
    if lobby_muc_service and room and room._data.lobbyroom then
        local lobby_room_obj = lobby_muc_service.get_room_from_jid(room._data.lobbyroom);
        if lobby_room_obj then
            lobby_room_obj:set_persistent(false);
            lobby_room_obj:destroy(newjid, message);
        end
        room._data.lobbyroom = nil;
    end
end

-- This is a copy of the function(handle_admin_query_set_command) from prosody 12 (d7857ef7843a)
function handle_admin_query_set_command_item(self, origin, stanza, item)
    if not item then
        origin.send(st.error_reply(stanza, "cancel", "bad-request"));
        return true;
    end
    if item.attr.jid then -- Validate provided JID
        item.attr.jid = jid_prep(item.attr.jid);
        if not item.attr.jid then
            origin.send(st.error_reply(stanza, "modify", "jid-malformed"));
            return true;
        elseif jid_resource(item.attr.jid) then
            origin.send(st.error_reply(stanza, "modify", "jid-malformed", "Bare JID expected, got full JID"));
            return true;
        end
    end
    if item.attr.nick then -- Validate provided nick
        item.attr.nick = resourceprep(item.attr.nick);
        if not item.attr.nick then
            origin.send(st.error_reply(stanza, "modify", "jid-malformed", "invalid nickname"));
            return true;
        end
    end
    if not item.attr.jid and item.attr.nick then
        -- COMPAT Workaround for Miranda sending 'nick' instead of 'jid' when changing affiliation
        local occupant = self:get_occupant_by_nick(self.jid.."/"..item.attr.nick);
        if occupant then item.attr.jid = occupant.bare_jid; end
    elseif item.attr.role and not item.attr.nick and item.attr.jid then
        -- Role changes should use nick, but we have a JID so pull the nick from that
        local nick = self:get_occupant_jid(item.attr.jid);
        if nick then item.attr.nick = jid_resource(nick); end
    end
    local actor = stanza.attr.from;
    local reason = item:get_child_text("reason");
    local success, errtype, err
    if item.attr.affiliation and item.attr.jid and not item.attr.role then
        local registration_data;
        if item.attr.nick then
            local room_nick = self.jid.."/"..item.attr.nick;
            local existing_occupant = self:get_occupant_by_nick(room_nick);
            if existing_occupant and existing_occupant.bare_jid ~= item.attr.jid then
                module:log("debug", "Existing occupant for %s: %s does not match %s", room_nick, existing_occupant.bare_jid, item.attr.jid);
                self:set_role(true, room_nick, nil, "This nickname is reserved");
            end
            module:log("debug", "Reserving %s for %s (%s)", item.attr.nick, item.attr.jid, item.attr.affiliation);
            registration_data = { reserved_nickname = item.attr.nick };
        end
        success, errtype, err = self:set_affiliation(actor, item.attr.jid, item.attr.affiliation, reason, registration_data);
    elseif item.attr.role and item.attr.nick and not item.attr.affiliation then
        success, errtype, err = self:set_role(actor, self.jid.."/"..item.attr.nick, item.attr.role, reason);
    else
        success, errtype, err = nil, "cancel", "bad-request";
    end
    self:save(true);
    if not success then
        origin.send(st.error_reply(stanza, errtype, err));
    else
        origin.send(st.reply(stanza));
    end
end

-- this is extracted from prosody to handle multiple invites
function handle_mediated_invite(room, origin, stanza, payload, host_module)
    local invitee = jid_prep(payload.attr.to);
    if not invitee then
        origin.send(st.error_reply(stanza, "cancel", "jid-malformed"));
        return true;
    elseif host_module:fire_event("muc-pre-invite", {room = room, origin = origin, stanza = stanza}) then
        return true;
    end
    local invite = muc_util.filter_muc_x(st.clone(stanza));
    invite.attr.from = room.jid;
    invite.attr.to = invitee;
    invite:tag('x', { xmlns = MUC_USER_NS })
            :tag('invite', {from = stanza.attr.from;})
                :tag('reason'):text(payload:get_child_text("reason")):up()
            :up()
        :up();
    if not host_module:fire_event("muc-invite", {room = room, stanza = invite, origin = origin, incoming = stanza}) then
        local join = invite:get_child('x', MUC_USER_NS);
        -- make sure we filter password added by any module
        if join then
            local password = join:get_child('password');
            if password then
                join:maptags(
                    function(tag)
                        for k, v in pairs(tag) do
                            if k == 'name' and v == 'password' then
                                return nil
                            end
                        end
                        return tag
                    end
                );
            end
        end
        room:route_stanza(invite);
    end
    return true;
end

local prosody_overrides = {
    -- handle multiple items at once
    handle_admin_query_set_command = function(self, origin, stanza)
        for i=1,#stanza.tags[1] do
            if handle_admin_query_set_command_item(self, origin, stanza, stanza.tags[1].tags[i]) then
                return true;
            end
        end
        return true;
    end,
    -- this is extracted from prosody to handle multiple invites
    handle_message_to_room = function(room, origin, stanza, host_module)
        local type = stanza.attr.type;
        if type == nil or type == "normal" then
            local x = stanza:get_child("x", MUC_USER_NS);
            if x then
                local handled = false;
                for _, payload in pairs(x.tags) do
                    if payload ~= nil and payload.name == "invite" and payload.attr.to then
                        handled = true;
                        handle_mediated_invite(room, origin, stanza, payload, host_module)
                    end
                end
                return handled;
            end
        end
    end
};

-- operates on already loaded lobby muc module
function process_lobby_muc_loaded(lobby_muc, host_module)
    module:log('debug', 'Lobby muc loaded');
    lobby_muc_service = lobby_muc;

    -- enable filtering presences in the lobby muc rooms
    filters.add_filter_hook(filter_session);

    -- Advertise lobbyrooms support on main domain so client can pick up the address and use it
    module:add_identity('component', LOBBY_IDENTITY_TYPE, lobby_muc_component_config);

    -- Tag the disco#info response with a feature that display name is required
    -- when the conference name from the web request has a lobby enabled.
    host_module:hook('host-disco-info-node', function (event)
        local session, reply, node = event.origin, event.reply, event.node;
        if node == LOBBY_IDENTITY_TYPE
            and session.jitsi_web_query_room
            and check_display_name_required then
            local room = get_room_by_name_and_subdomain(session.jitsi_web_query_room, session.jitsi_web_query_prefix);

            if room and room._data.lobbyroom then
                reply:tag('feature', { var = DISPLAY_NAME_REQUIRED_FEATURE }):up();
            end
        end
        event.exists = true;
    end);

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

    -- listens for kicks in lobby room, 307 is the status for kick according to xep-0045
    host_module:hook('muc-broadcast-presence', function (event)
        local actor, occupant, room, x = event.actor, event.occupant, event.room, event.x;
        if presence_check_status(x, '307') then
            local display_name = occupant:get_presence():get_child_text(
                'nick', 'http://jabber.org/protocol/nick');
            -- we need to notify in the main room
            notify_lobby_access(room.main_room, actor, occupant.nick, display_name, false);
        end
    end);
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

    -- hooks when lobby is enabled to create its room, only done here or by admin
    host_module:hook('muc-config-submitted', function(event)
        local actor, room = event.actor, event.room;
        local actor_node = jid_split(actor);
        if actor_node == 'focus' then
            return;
        end
        local members_only = event.fields['muc#roomconfig_membersonly'] and true or nil;
        if members_only then
            local lobby_created = attach_lobby_room(room, actor);
            if lobby_created then
                module:fire_event('jitsi-lobby-enabled', { room = room; });
                event.status_codes['104'] = true;
                notify_lobby_enabled(room, actor, true);
            end
        elseif room._data.lobbyroom then
            destroy_lobby_room(room, room.jid);
            module:fire_event('jitsi-lobby-disabled', { room = room; });
            notify_lobby_enabled(room, actor, false);
        end
    end);
    host_module:hook('muc-room-destroyed',function(event)
        local room = event.room;
        if room._data.lobbyroom then
            destroy_lobby_room(room, nil);
        end
    end);
    host_module:hook('muc-disco#info', function (event)
        local room = event.room;
        if (room._data.lobbyroom and room:get_members_only()) then
            table.insert(event.form, {
                name = 'muc#roominfo_lobbyroom';
                label = 'Lobby room jid';
                value = '';
            });
            event.formdata['muc#roominfo_lobbyroom'] = room._data.lobbyroom;
        end
    end);

    host_module:hook('muc-occupant-pre-join', function (event)
        local occupant, room, stanza = event.occupant, event.room, event.stanza;

        if is_healthcheck_room(room.jid) or not room:get_members_only() or ends_with(occupant.nick, '/focus') then
            return;
        end

        local join = stanza:get_child('x', MUC_NS);
        if not join then
            return;
        end

        local invitee = event.stanza.attr.from;
        local invitee_bare_jid = jid_bare(invitee);
        local _, invitee_domain = jid_split(invitee);
        local whitelistJoin = false;

        -- whitelist participants
        if whitelist:contains(invitee_domain) or whitelist:contains(invitee_bare_jid) then
            whitelistJoin = true;
        end

        local password = join:get_child_text('password', MUC_NS);
        if password and room:get_password() and password == room:get_password() then
            whitelistJoin = true;
        end

        if whitelistJoin then
            local affiliation = room:get_affiliation(invitee);
            -- if it was already set to be whitelisted member
            if not affiliation or affiliation == 'none' or affiliation == 'member' then
                occupant.role = 'participant';
                room:set_affiliation(true, invitee_bare_jid, 'member');
                room:save_occupant(occupant);

                return;
            end
        elseif room:get_password() then
            local affiliation = room:get_affiliation(invitee);
            -- if pre-approved and password is set for the room, add the password to allow joining
            if affiliation == 'member' and not password then
                join:tag('password', { xmlns = MUC_NS }):text(room:get_password());
            end
        end

        -- Check for display name if missing return an error
        local displayName = stanza:get_child_text('nick', 'http://jabber.org/protocol/nick');
        if (not displayName or #displayName == 0) and not room._data.lobby_skip_display_name_check then
            local reply = st.error_reply(stanza, 'modify', 'not-acceptable');
            reply.tags[1].attr.code = '406';
            reply:tag('displayname-required', { xmlns = 'http://jitsi.org/jitmeet', lobby = 'true' }):up():up();

            event.origin.send(reply:tag('x', {xmlns = MUC_NS}));
            return true;
        end

        -- we want to add the custom lobbyroom field to fill in the lobby room jid
        local invitee = event.stanza.attr.from;
        local affiliation = room:get_affiliation(invitee);
        if not affiliation or affiliation == 'none' then
            local reply = st.error_reply(stanza, 'auth', 'registration-required');
            reply.tags[1].attr.code = '407';
            if room._data.lobby_extra_reason then
                reply:tag(room._data.lobby_extra_reason, { xmlns = 'http://jitsi.org/jitmeet' }):up();
            end
            reply:tag('lobbyroom', { xmlns = 'http://jitsi.org/jitmeet' }):text(room._data.lobbyroom):up():up();

            -- TODO: Drop this tag at some point (when all mobile clients and jigasi are updated), as this violates the rfc
            reply:tag('lobbyroom'):text(room._data.lobbyroom):up();

            event.origin.send(reply:tag('x', {xmlns = MUC_NS}));
            return true;
        end
    end, -4); -- the default hook on members_only module is on -5

    -- listens for invites for participants to join the main room
    host_module:hook('muc-invite', function(event)
        local room, stanza = event.room, event.stanza;
        local invitee = stanza.attr.to;
        local from = stanza:get_child('x', MUC_USER_NS)
            :get_child('invite').attr.from;

        if lobby_muc_service and room._data.lobbyroom then
            local lobby_room_obj = lobby_muc_service.get_room_from_jid(room._data.lobbyroom);
            if lobby_room_obj then
                local occupant = lobby_room_obj:get_occupant_by_real_jid(invitee);
                if occupant then
                    local display_name = occupant:get_presence():get_child_text(
                            'nick', 'http://jabber.org/protocol/nick');

                    notify_lobby_access(room, from, occupant.nick, display_name, true);
                end
            end
        end
    end);

    -- listen for admin set
    for event_name, method in pairs {
        -- Normal room interactions
        ["iq-set/bare/http://jabber.org/protocol/muc#admin:query"] = "handle_admin_query_set_command" ;
        ["message/bare"] = "handle_message_to_room" ;
        -- Host room
        ["iq-set/host/http://jabber.org/protocol/muc#admin:query"] = "handle_admin_query_set_command" ;
        ["message/host"] = "handle_message_to_room" ;
    } do
        host_module:hook(event_name, function (event)
            local origin, stanza = event.origin, event.stanza;
            local room_jid = jid_bare(stanza.attr.to);
            local room = get_room_from_jid(room_jid);

            if room then
                return prosody_overrides[method](room, origin, stanza, host_module);
            end
        end, 1) -- make sure we handle it before prosody that uses priority -2 for this
    end
end);

function handle_create_lobby(event)
    local room = event.room;

    -- since this is called by backend rather than triggered by UI, we need to handle a few additional things:
    --  1. Make sure existing participants are already members or they will get kicked out when set_members_only(true)
    --  2. Trigger a 104 (config change) status message so UI state is properly updated for existing users

    -- make sure all existing occupants are members
    for _, occupant in room:each_occupant() do
        local affiliation = room:get_affiliation(occupant.bare_jid);
        if valid_affiliations[affiliation or "none"] < valid_affiliations.member then
            room:set_affiliation(true, occupant.bare_jid, 'member');
        end
    end
    -- Now it is safe to set the room to members only
    room:set_members_only(true);
    room._data.lobby_extra_reason = event.reason;
    room._data.lobby_skip_display_name_check = event.skip_display_name_check;

    -- Trigger a presence with 104 so existing participants retrieves new muc#roomconfig
    room:broadcast_message(
        st.message({ type='groupchat', from=room.jid })
            :tag('x', { xmlns = MUC_USER_NS })
                :tag('status', { code='104' })
    );

    -- Attach the lobby room.
    attach_lobby_room(room);
end

function handle_destroy_lobby(event)
    local room = event.room;

    -- since this is called by backend rather than triggered by UI, we need to
    -- trigger a 104 (config change) status message so UI state is properly updated for existing users (and jicofo)
    destroy_lobby_room(room, event.newjid, event.message);

    -- Trigger a presence with 104 so existing participants retrieves new muc#roomconfig
    room:broadcast_message(
        st.message({ type='groupchat', from=room.jid })
            :tag('x', { xmlns = MUC_USER_NS })
                :tag('status', { code='104' })
    );
end

module:hook_global('config-reloaded', load_config);
module:hook_global('create-lobby-room', handle_create_lobby);
module:hook_global('destroy-lobby-room', handle_destroy_lobby);
