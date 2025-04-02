--- activate under the main muc component
local filters = require 'util.filters';
local jid = require "util.jid";
local jid_bare = require "util.jid".bare;
local jid_host = require "util.jid".host;
local st = require "util.stanza";
local util = module:require "util";
local is_admin = util.is_admin;
local is_healthcheck_room = util.is_healthcheck_room;
local is_moderated = util.is_moderated;
local get_room_from_jid = util.get_room_from_jid;
local room_jid_match_rewrite = util.room_jid_match_rewrite;
local presence_check_status = util.presence_check_status;
local MUC_NS = 'http://jabber.org/protocol/muc';

local disable_revoke_owners;

local function load_config()
    disable_revoke_owners = module:get_option_boolean("allowners_disable_revoke_owners", false);
end
load_config();

-- List of the bare_jids of all occupants that are currently joining (went through pre-join) and will be promoted
-- as moderators. As pre-join (where added) and joined event (where removed) happen one after another this list should
-- have length of 1
local joining_moderator_participants = {};

module:hook("muc-room-created", function(event)
    local room = event.room;

    if room.jitsiMetadata then
        room.jitsiMetadata.allownersEnabled = true;
    end
end, -2); -- room_metadata should run before this module on -1

module:hook("muc-occupant-pre-join", function (event)
    local room, occupant = event.room, event.occupant;

    if is_healthcheck_room(room.jid) or is_admin(occupant.bare_jid) then
        return;
    end

    local moderated, room_name, subdomain = is_moderated(room.jid);
    if moderated then
        local session = event.origin;
        local token = session.auth_token;

        if not token then
            module:log('debug', 'skip allowners for non-auth user subdomain:%s room_name:%s', subdomain, room_name);
            return;
        end

        if not (room_name == session.jitsi_meet_room or session.jitsi_meet_room == '*') then
            module:log('debug', 'skip allowners for auth user and non matching room name: %s, jwt room name: %s',
                room_name, session.jitsi_meet_room);
            return;
        end

        if session.jitsi_meet_domain ~= '*' and subdomain ~= session.jitsi_meet_domain then
            module:log('debug', 'skip allowners for auth user and non matching room subdomain: %s, jwt subdomain: %s',
                subdomain, session.jitsi_meet_domain);
            return;
        end
    end

    -- mark this participant that it will be promoted and is currently joining
    joining_moderator_participants[occupant.bare_jid] = true;
end, 2);

module:hook("muc-occupant-joined", function (event)
    local room, occupant = event.room, event.occupant;

    local promote_to_moderator = joining_moderator_participants[occupant.bare_jid];
    -- clear it
    joining_moderator_participants[occupant.bare_jid] = nil;

    if promote_to_moderator ~= nil then
        room:set_affiliation(true, occupant.bare_jid, "owner");
    end
end, 2);

module:hook_global('config-reloaded', load_config);

-- Filters self-presences to a jid that exist in joining_participants array
-- We want to filter those presences where we send first `participant` and just after it `moderator`
function filter_stanza(stanza)
    -- when joining_moderator_participants is empty there is nothing to filter
    if next(joining_moderator_participants) == nil
            or not stanza.attr
            or not stanza.attr.to
            or stanza.name ~= "presence" then
        return stanza;
    end

    -- we want to filter presences only on this host for allowners and skip anything like lobby etc.
    local host_from = jid_host(room_jid_match_rewrite(stanza.attr.from));
    if host_from ~= module.host then
        return stanza;
    end

    local bare_to = jid_bare(stanza.attr.to);
    if stanza:get_error() and joining_moderator_participants[bare_to] then
        -- pre-join succeeded but joined did not so we need to clear cache
        joining_moderator_participants[bare_to] = nil;
        return stanza;
    end

    local muc_x = stanza:get_child('x', MUC_NS..'#user');
    if not muc_x then
        return stanza;
    end

    if joining_moderator_participants[bare_to] and presence_check_status(muc_x, '110') then
        -- skip the local presence for participant
        return nil;
    end

    -- skip sending the 'participant' presences to all other people in the room
    for item in muc_x:childtags('item') do
        if joining_moderator_participants[jid_bare(item.attr.jid)] then
            return nil;
        end
    end

    return stanza;
end
function filter_session(session)
    -- domain mapper is filtering on default priority 0, and we need it after that
    filters.add_filter(session, 'stanzas/out', filter_stanza, -1);
end

-- enable filtering presences
filters.add_filter_hook(filter_session);

-- filters any attempt to revoke owner rights on non moderated rooms
function filter_admin_set_query(event)
    local origin, stanza = event.origin, event.stanza;
    local room_jid = jid_bare(stanza.attr.to);
    local room = get_room_from_jid(room_jid);

    local item = stanza.tags[1].tags[1];
    local _aff = item.attr.affiliation;

    -- if it is a moderated room we skip it
    if room and is_moderated(room.jid) then
        return nil;
    end

    -- any revoking is disabled, everyone should be owners
    if _aff == 'none' or _aff == 'outcast' or _aff == 'member' then
        origin.send(st.error_reply(stanza, "auth", "forbidden"));
        return true;
    end
end

if not disable_revoke_owners then
    -- default prosody priority for handling these is -2
    module:hook("iq-set/bare/http://jabber.org/protocol/muc#admin:query", filter_admin_set_query, 5);
    module:hook("iq-set/host/http://jabber.org/protocol/muc#admin:query", filter_admin_set_query, 5);
end
