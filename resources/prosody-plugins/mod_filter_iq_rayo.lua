-- This module is enabled under the main virtual host
local new_throttle = require "util.throttle".create;
local st = require "util.stanza";
local jid = require "util.jid";

local token_util = module:require "token/util".new(module);
local util = module:require 'util';
local is_admin = util.is_admin;
local room_jid_match_rewrite = util.room_jid_match_rewrite;
local is_feature_allowed = util.is_feature_allowed;
local is_sip_jigasi = util.is_sip_jigasi;
local get_room_from_jid = util.get_room_from_jid;
local process_host_module = util.process_host_module;
local jid_bare = require "util.jid".bare;

local sessions = prosody.full_sessions;

local measure_drop = module:measure('drop', 'counter');

local main_muc_component_host = module:get_option_string('main_muc');
if main_muc_component_host == nil then
    module:log('error', 'main_muc not configured. Cannot proceed.');
    return;
end
local main_muc_service;

-- no token configuration but required
if token_util == nil then
    module:log("error", "no token configuration but it is required");
    return;
end

-- this is the main virtual host of the main prosody that this vnode serves
local main_domain = module:get_option_string('main_domain');
-- only the visitor prosody has main_domain setting
local is_visitor_prosody = main_domain ~= nil;

-- this is the main virtual host of this vnode
local local_domain = module:get_option_string('muc_mapper_domain_base');

-- The maximum number of simultaneous calls,
-- and also the maximum number of new calls per minute that a session is allowed to create.
local limit_outgoing_calls;
local function load_config()
    limit_outgoing_calls = module:get_option_number("max_number_outgoing_calls", -1);
end
load_config();

-- Header names to use to push extra data extracted from token, if any
local OUT_INITIATOR_USER_ATTR_NAME = "X-outbound-call-initiator-user";
local OUT_INITIATOR_GROUP_ATTR_NAME = "X-outbound-call-initiator-group";
local OUT_ROOM_NAME_ATTR_NAME = "JvbRoomName";

local OUTGOING_CALLS_THROTTLE_INTERVAL = 60; -- if max_number_outgoing_calls is enabled it will be
                                             -- the max number of outgoing calls a user can try for a minute

-- filters rayo iq in case of requested from not jwt authenticated sessions
-- or if the session has features in user context and it doesn't mention
-- feature "outbound-call" to be enabled
module:hook("pre-iq/full", function(event)
    local stanza = event.stanza;
    if stanza.name == "iq" then
        local dial = stanza:get_child('dial', 'urn:xmpp:rayo:1');
        if dial then
            local session = event.origin;
            local token = session.auth_token;

            -- find header with attr name 'JvbRoomName' and extract its value
            local roomName;
            -- Remove any 'header' element if it already exists, so it cannot be spoofed by a client
            dial:maptags(function(tag)
                if tag.name == "header"
                        and (tag.attr.name == OUT_INITIATOR_USER_ATTR_NAME
                                or tag.attr.name == OUT_INITIATOR_GROUP_ATTR_NAME) then
                    return nil
                elseif tag.name == "header" and tag.attr.name == OUT_ROOM_NAME_ATTR_NAME then
                    roomName = tag.attr.value;
                    -- we will remove it as we will add it later, modified
                    if is_visitor_prosody then
                        return nil;
                    end
                end
                return tag
            end);

            local room_jid = jid.bare(stanza.attr.to);
            local room_real_jid = room_jid_match_rewrite(room_jid);
            local room = main_muc_service.get_room_from_jid(room_real_jid);
            local is_sender_in_room = room:get_occupant_jid(stanza.attr.from) ~= nil;

            if not room or not is_sender_in_room then
                module:log("warn", "Filtering stanza dial, stanza:%s", tostring(stanza));
                session.send(st.error_reply(stanza, "auth", "forbidden"));
                return true;
            end

            local feature = dial.attr.to == 'jitsi_meet_transcribe' and 'transcription' or 'outbound-call';
            local is_session_allowed = is_feature_allowed(
                feature,
                session.jitsi_meet_context_features,
                session.granted_jitsi_meet_context_features,
                room:get_affiliation(stanza.attr.from) == 'owner');

            if roomName == nil
                or roomName ~= room_jid
                or (token ~= nil and not token_util:verify_room(session, room_real_jid))
                or not is_session_allowed
            then
                module:log("warn", "Filtering stanza dial, stanza:%s", tostring(stanza));
                session.send(st.error_reply(stanza, "auth", "forbidden"));
                return true;
            end

            -- we get current user_id or group, or the one from the granted one
            -- so guests and the user that granted rights are sharing same limit, as guest can be without token
            local user_id, group_id = nil, session.jitsi_meet_context_group;
            if session.jitsi_meet_context_user then
                user_id = session.jitsi_meet_context_user["id"];
            else
                user_id = session.granted_jitsi_meet_context_user_id;
                group_id = session.granted_jitsi_meet_context_group_id;
            end

            -- now lets check any limits for outgoing calls if configured
            if feature == 'outbound-call' and limit_outgoing_calls > 0 then
                if not session.dial_out_throttle then
                    -- module:log("debug", "Enabling dial-out throttle session=%s.", session);
                    session.dial_out_throttle = new_throttle(limit_outgoing_calls, OUTGOING_CALLS_THROTTLE_INTERVAL);
                end

                if not session.dial_out_throttle:poll(1) -- we first check the throttle so we can mark one incoming dial for the balance
                    or get_concurrent_outgoing_count(user_id, group_id) >= limit_outgoing_calls
                then
                    module:log("warn",
                        "Filtering stanza dial, stanza:%s, outgoing calls limit reached", tostring(stanza));
                    measure_drop(1);
                    session.send(st.error_reply(stanza, "cancel", "resource-constraint"));
                    return true;
                end
            end

            -- now lets insert token information if any
            if session and user_id then
                -- adds initiator user id from token
                dial:tag("header", {
                    xmlns = "urn:xmpp:rayo:1",
                    name = OUT_INITIATOR_USER_ATTR_NAME,
                    value = user_id });
                dial:up();

                -- Add the initiator group information if it is present
                if session.jitsi_meet_context_group then
                    dial:tag("header", {
                        xmlns = "urn:xmpp:rayo:1",
                        name = OUT_INITIATOR_GROUP_ATTR_NAME,
                        value = session.jitsi_meet_context_group });
                    dial:up();
                end
            end

            -- we want to instruct jigasi to enter the main room, so send the correct main room jid
            if is_visitor_prosody then
                dial:tag("header", {
                    xmlns = "urn:xmpp:rayo:1",
                    name = OUT_ROOM_NAME_ATTR_NAME,
                    value = string.gsub(roomName, local_domain, main_domain) });
                dial:up();
            end
        end
    end
end, 1); -- make sure we run before domain mapper

--- Finds and returns the number of concurrent outgoing calls for a user
-- @param context_user the user id extracted from the token
-- @param context_group the group id extracted from the token
-- @return returns the count of concurrent calls
function get_concurrent_outgoing_count(context_user, context_group)
    local count = 0;
    local rooms = main_muc_service.live_rooms();

    -- now lets iterate over rooms and occupants and search for
    -- call initiated by the user
    for room in rooms do
        for _, occupant in room:each_occupant() do
            for _, presence in occupant:each_session() do

                local initiator = is_sip_jigasi(presence);

                local found_user = false;
                local found_group = false;

                if initiator then
                    initiator:maptags(function (tag)
                        if tag.name == "header"
                            and tag.attr.name == OUT_INITIATOR_USER_ATTR_NAME then
                            found_user = tag.attr.value == context_user;
                        elseif tag.name == "header"
                            and tag.attr.name == OUT_INITIATOR_GROUP_ATTR_NAME then
                            found_group = tag.attr.value == context_group;
                        end

                        return tag;
                    end );
                    -- if found a jigasi participant initiated by the concurrent
                    -- participant, count it
                    if found_user
                        and (context_group == nil or found_group) then
                        count = count + 1;
                    end
                end
            end
        end
    end

    return count;
end

module:hook_global('config-reloaded', load_config);

function process_main_muc_loaded(main_muc, host_module)
    module:log('debug', 'Main muc loaded');

    main_muc_service = main_muc;
end

process_host_module(main_muc_component_host, function(host_module, host)
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

-- when recording participants may enable and backend transcriptions
-- it is possible that participant is not moderator, but has the features enabled for
-- transcribing, we need to allow that operation
module:hook('jitsi-metadata-allow-moderation', function (event)
    local data, key, occupant, session = event.data, event.key, event.actor, event.session;

    if key == 'recording' and data and data.isTranscribingEnabled ~= nil then
        -- if it is recording we want to allow setting in metadata if not moderator but features
        -- are present
        if session.jitsi_meet_context_features
            and occupant.role ~= 'moderator'
            and is_feature_allowed('transcription', session.jitsi_meet_context_features)
            and is_feature_allowed('recording', session.jitsi_meet_context_features) then
                local res = {};
                res.isTranscribingEnabled = data.isTranscribingEnabled;
                return res;
        elseif not session.jitsi_meet_context_features and occupant.role == 'moderator' then
            return data;
        else
            return nil;
        end
    end

    if occupant.role == 'moderator' then
        return data;
    end

    return nil;
end);

