-- this is auto loaded by meeting_id
local filters = require 'util.filters';
local jid = require 'util.jid';

local util = module:require 'util';
local is_admin = util.is_admin;
local get_room_from_jid = util.get_room_from_jid;
local is_healthcheck_room = util.is_healthcheck_room;
local room_jid_match_rewrite = util.room_jid_match_rewrite;
local ends_with = util.ends_with;
local presence_check_status = util.presence_check_status;

local MUC_NS = 'http://jabber.org/protocol/muc';

local muc_domain_prefix = module:get_option_string('muc_mapper_domain_prefix', 'conference');

local muc_domain_base = module:get_option_string('muc_mapper_domain_base');
if not muc_domain_base then
    module:log('warn', 'No "muc_domain_base" option set, disabling kick check endpoint.');
    return ;
end

-- only the visitor prosody has main_domain setting
local is_visitor_prosody = module:get_option_string('main_domain') ~= nil;

-- load it only on the main muc component as it is loaded by muc_meeting_id which is loaded and for the breakout room muc
if muc_domain_prefix..'.'..muc_domain_base ~= module.host or is_visitor_prosody then
    return;
end

local sessions = prosody.full_sessions;
local default_permissions;

local function load_config()
    default_permissions = module:get_option('jitsi_default_permissions', {
        livestreaming = true;
        recording = true;
        transcription = true;
        ['outbound-call'] = true;
        ['create-polls'] = true;
        ['send-groupchat'] = true;
        flip = true;
    });
end
load_config();

function process_set_affiliation(event)
    local actor, affiliation, jid, previous_affiliation, room
        = event.actor, event.affiliation, event.jid, event.previous_affiliation, event.room;
    local actor_session = sessions[actor];

    if is_admin(jid) or is_healthcheck_room(room.jid) or not actor or not previous_affiliation
        or not actor_session or not actor_session.jitsi_meet_context_features then
        return;
    end

    local occupant;
    for _, o in room:each_occupant() do
        if o.bare_jid == jid then
            occupant = o;
        end
    end

    if not occupant then
        return;
    end

    local occupant_session = sessions[occupant.jid];
    if not occupant_session then
        return;
    end

    if previous_affiliation == 'none' and affiliation == 'owner' then
        occupant_session.granted_jitsi_meet_context_features = actor_session.jitsi_meet_context_features;
        if actor_session.jitsi_meet_context_user then
            occupant_session.granted_jitsi_meet_context_user_id = actor_session.jitsi_meet_context_user['id'];
        end
        occupant_session.granted_jitsi_meet_context_group_id = actor_session.jitsi_meet_context_group;
    elseif previous_affiliation == 'owner' and ( affiliation == 'member' or affiliation == 'none' ) then
        occupant_session.granted_jitsi_meet_context_features = nil;
        occupant_session.granted_jitsi_meet_context_user_id = nil;
        occupant_session.granted_jitsi_meet_context_group_id = nil;

        -- on revoke
        if not session.auth_token then
            occupant_session.jitsi_meet_context_features = nil;
        end
    end
end

-- Detects when sending self-presence because of role change
-- we can end up here because of the following cases:
-- 1. user joins the room and is granted moderator by another moderator or jicofo
-- 2. Some module changes the role of the user by using set_affiliation method
-- In cases where authentication is 'anonymous', 'jitsi-anonymous', 'internal_hashed', 'internal_plain', 'cyrus' we
-- want to send default permissions all to indicate UI that everything is allowed (to not relay on the UI to check
-- is participant moderator or not), to allow finer control over the permissions.
-- In case the authentication is 'token' based we want to send permissions only if the token of the user does not include
-- features in the user.context.
-- In case of allowners we want to send the permissions, no matter of the authentication method.
-- In case permissions were granted we want to send the granted permissions in all cases except when the user is
-- using token that has features pre-defined (authentication is 'token').
function filter_stanza(stanza, session)
    if not stanza.attr or not stanza.attr.to or stanza.name ~= 'presence'
        or stanza.attr.type == 'unavailable' or ends_with(stanza.attr.from, '/focus') then
        return stanza;
    end

    local bare_to = jid.bare(stanza.attr.to);
    if is_admin(bare_to) then
        return stanza;
    end

    local muc_x = stanza:get_child('x', MUC_NS..'#user');
    if not muc_x then
        return stanza;
    end

    local room = get_room_from_jid(room_jid_match_rewrite(jid.bare(stanza.attr.from)));

    if not room or not room.send_default_permissions_to or is_healthcheck_room(room.jid) then
        return stanza;
    end

    if session.auth_token and session.jitsi_meet_context_features then -- token and features are set so skip
        room.send_default_permissions_to[bare_to] = nil;
        return stanza;
    end

    -- we are sending permissions only when becoming a member
    local is_moderator = false;
    for item in muc_x:childtags('item') do
        if item.attr.role == 'moderator' then
            is_moderator = true;
            break;
        end
    end

    if not is_moderator or not room.send_default_permissions_to[bare_to]
        or not presence_check_status(muc_x, '110') then
        return stanza;
    end

    local permissions_to_send = session.granted_jitsi_meet_context_features or default_permissions;

    room.send_default_permissions_to[bare_to] = nil;

    if not session.granted_jitsi_meet_context_features and not session.jitsi_meet_context_features then
        session.jitsi_meet_context_features = {};
    end

    stanza:tag('permissions', { xmlns='http://jitsi.org/jitmeet' });
    for k, v in pairs(permissions_to_send) do
        local val = tostring(v);
        stanza:tag('p', { name = k, val = val }):up();
        if session.jitsi_meet_context_features then
            session.jitsi_meet_context_features[k] = val;
        end
    end
    stanza:up();

    return stanza;
end

-- we need to indicate that we will send permissions if we need to
module:hook('muc-pre-set-affiliation', function(event)
    local jid, room = event.jid, event.room;

    if not room.send_default_permissions_to then
        room.send_default_permissions_to = {};
    end
    room.send_default_permissions_to[jid] = true;
end);
module:hook('muc-set-affiliation', process_set_affiliation);

function filter_session(session)
    -- domain mapper is filtering on default priority 0
    -- allowners is -1 and we need it after that
    filters.add_filter(session, 'stanzas/out', filter_stanza, -2);
end

-- enable filtering presences
filters.add_filter_hook(filter_session);
