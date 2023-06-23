-- Token authentication
-- Copyright (C) 2021-present 8x8, Inc.

local log = module._log;
local host = module.host;
local st = require "util.stanza";
local um_is_admin = require "core.usermanager".is_admin;
local jid_split = require 'util.jid'.split;
local jid_bare = require 'util.jid'.bare;


local function is_admin(jid)
    return um_is_admin(jid, host);
end

local parentHostName = string.gmatch(tostring(host), "%w+.(%w.+)")();
if parentHostName == nil then
    module:log("error", "Failed to start - unable to get parent hostname");
    return;
end

local parentCtx = module:context(parentHostName);
if parentCtx == nil then
    module:log("error",
        "Failed to start - unable to get parent context for host: %s",
        tostring(parentHostName));
    return;
end

local token_util = module:require "token/util".new(parentCtx);

-- no token configuration
if token_util == nil then
    return;
end

module:log("debug",
	"%s - starting MUC token verifier app_id: %s app_secret: %s allow empty: %s",
	tostring(host), tostring(token_util.appId), tostring(token_util.appSecret),
	tostring(token_util.allowEmptyToken));

-- option to disable room modification (sending muc config form) for guest that do not provide token
local require_token_for_moderation;
-- option to allow domains to skip token verification
local allowlist;
local function load_config()
    require_token_for_moderation = module:get_option_boolean("token_verification_require_token_for_moderation");
    allowlist = module:get_option_set('token_verification_allowlist', {});
end
load_config();

-- verify user and whether he is allowed to join a room based on the token information
local function verify_user(session, stanza)
    module:log("debug", "Session token: %s, session room: %s",
        tostring(session.auth_token),
        tostring(session.jitsi_meet_room));

    -- token not required for admin users
    local user_jid = stanza.attr.from;
    if is_admin(user_jid) then
        module:log("debug", "Token not required from admin user: %s", user_jid);
        return true;
    end

    -- token not required for users matching allow list
    local user_bare_jid = jid_bare(user_jid);
    local _, user_domain = jid_split(user_jid);

    -- allowlist for participants
    if allowlist:contains(user_domain) or allowlist:contains(user_bare_jid) then
        module:log("debug", "Token not required from user in allow list: %s", user_jid);
        return true;
    end


    module:log("debug",
        "Will verify token for user: %s, room: %s ", user_jid, stanza.attr.to);
    if not token_util:verify_room(session, stanza.attr.to) then
        module:log("error", "Token %s not allowed to join: %s",
            tostring(session.auth_token), tostring(stanza.attr.to));
        session.send(
            st.error_reply(
                stanza, "cancel", "not-allowed", "Room and token mismatched"));
        return false; -- we need to just return non nil
    end
    module:log("debug", "allowed: %s to enter/create room: %s", user_jid, stanza.attr.to);
    return true;
end

module:hook("muc-room-pre-create", function(event)
    local origin, stanza = event.origin, event.stanza;
    module:log("debug", "pre create: %s %s", tostring(origin), tostring(stanza));
    if not verify_user(origin, stanza) then
        return true; -- Returning any value other than nil will halt processing of the event
    end
end, 99);

module:hook("muc-occupant-pre-join", function(event)
    local origin, room, stanza = event.origin, event.room, event.stanza;
    module:log("debug", "pre join: %s %s", tostring(room), tostring(stanza));
    if not verify_user(origin, stanza) then
        return true; -- Returning any value other than nil will halt processing of the event
    end
end, 99);

for event_name, method in pairs {
    -- Normal room interactions
    ["iq-set/bare/http://jabber.org/protocol/muc#owner:query"] = "handle_owner_query_set_to_room" ;
    -- Host room
    ["iq-set/host/http://jabber.org/protocol/muc#owner:query"] = "handle_owner_query_set_to_room" ;
} do
    module:hook(event_name, function (event)
        local session, stanza = event.origin, event.stanza;

        -- if we do not require token we pass it through(default behaviour)
        -- or the request is coming from admin (focus)
        if not require_token_for_moderation or is_admin(stanza.attr.from) then
            return;
        end

        -- jitsi_meet_room is set after the token had been verified
        if not session.auth_token or not session.jitsi_meet_room then
            session.send(
                st.error_reply(
                    stanza, "cancel", "not-allowed", "Room modification disabled for guests"));
            return true;
        end

    end, -1);  -- the default prosody hook is on -2
end

module:hook_global('config-reloaded', load_config);
