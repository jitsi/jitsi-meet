-- Validates the resourcepart of client JIDs when joining a MUC.
-- Copyright (C) 2024-present 8x8, Inc.
--
-- Hooks into muc-occupant-pre-join (and muc-room-pre-create for the first
-- user) and rejects joins whose resource part is invalid.
--
-- A valid resource consists only of alphanumerics and underscores and must
-- NOT start with an underscore: ^[a-zA-Z0-9][a-zA-Z0-9_]*$
--
-- When "anonymous_strict" mode is enabled, users on domains whose
-- authentication provider is "anonymous" or "jitsi-anonymous" are
-- additionally required to use a MUC resource equal to the first 8 characters
-- of their real JID username (the UUID prefix assigned by the server).
-- The check is dynamic: the auth provider is read from prosody.hosts at
-- join time, so no static domain list is needed.
--
-- Example configuration (place under the MUC component):
--
--   Component "conference.meet.jitsi" "muc"
--       modules_enabled = { "muc_resource_validate" }
--       -- Domains/bare-JIDs exempt from all checks (e.g. focus, jibri)
--       muc_resource_whitelist = { "auth.meet.jitsi", "recorder@recorder.meet.jitsi" }
--       -- Enable strict anonymous-user check
--       anonymous_strict = true

local jid_split = require "util.jid".split;
local st = require "util.stanza";
local util = module:require "util";
local is_healthcheck_room = util.is_healthcheck_room;

-- Valid resource: starts with alphanumeric, followed by zero-or-more alphanumerics / underscores.
local VALID_RESOURCE_PATTERN = "^[a-zA-Z0-9][a-zA-Z0-9_]*$";

local anonymous_strict;
local whitelist;

local function load_config()
    anonymous_strict = module:get_option_boolean("anonymous_strict", false);
    whitelist = module:get_option_set("muc_resource_whitelist", {});
end
load_config();

-- Returns true when the domain uses anonymous XMPP authentication
-- ("anonymous", "jitsi-anonymous") or token auth ("token"), which also
-- uses anonymous XMPP login with token verification layered on top.
-- Prosody's usermanager sets host.users.name to the value of the
-- "authentication" config option.
local function is_anonymous_domain(domain)
    local host_obj = prosody.hosts[domain];
    if not host_obj or not host_obj.users then
        return false;
    end
    local auth = host_obj.users.name;
    return auth == "anonymous" or auth == "jitsi-anonymous" or auth == "token";
end

-- Returns true (halts event processing) when the join should be rejected.
local function check_resource(event)
    local room, origin, stanza = event.room, event.origin, event.stanza;

    if is_healthcheck_room(room.jid) then
        return;
    end

    local user, domain = jid_split(stanza.attr.from);
    local _, _, muc_resource = jid_split(stanza.attr.to);

    if user == nil then
        return;
    end

    -- Whitelisted domains or bare JIDs skip all checks.
    if whitelist:contains(domain) or whitelist:contains(user .. "@" .. domain) then
        return;
    end

    -- 1. Validate the resource part of the MUC JID (the occupant nickname).
    if not muc_resource or not muc_resource:match(VALID_RESOURCE_PATTERN) then
        module:log("warn", "Rejecting join with invalid MUC resource from %s (muc_resource: %s)",
            stanza.attr.from, tostring(muc_resource));
        origin.send(st.error_reply(stanza, "cancel", "not-allowed", "Invalid resource"));
        return true;
    end

    -- 2. Anonymous strict mode: MUC resource must equal the 8-char UUID prefix of the real JID username.
    if anonymous_strict and is_anonymous_domain(domain) then
        local uuid_prefix = user:sub(1, 8);
        if muc_resource ~= uuid_prefix then
            module:log("warn", "Rejecting anonymous user: MUC resource %s does not match UUID prefix %s (from %s)",
                muc_resource, uuid_prefix, stanza.attr.from);
            origin.send(st.error_reply(stanza, "cancel", "not-allowed", "Invalid anonymous user ID"));
            return true;
        end
    end
end

-- Also fire for the first occupant who implicitly creates the room.
module:log("info", "module loaded (anonymous_strict=%s)", tostring(anonymous_strict));

module:hook("muc-room-pre-create", function(event)
    -- muc-room-pre-create has no event.room yet; construct a minimal proxy so
    -- is_healthcheck_room can inspect the target JID.
    local stanza = event.stanza;
    local fake_room = { jid = stanza.attr.to };
    return check_resource({
        room    = fake_room,
        origin  = event.origin,
        stanza  = stanza,
    });
end, 10);

module:hook("muc-occupant-pre-join", check_resource, 10);

module:hook_global("config-reloaded", load_config);
