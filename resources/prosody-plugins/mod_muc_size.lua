-- Prosody IM
-- Copyright (C) 2021-present 8x8, Inc.
--
-- mod_muc_size exposes HTTP endpoints that let external services query the
-- occupancy and participant details of MUC rooms managed by the associated
-- conference component. It provides three routes:
--
--   GET /room-size?room=<name>&domain=<base>[&subdomain=<sub>][&token=<jwt>]
--       Returns {"participants": N} where N is the non-focus occupant count.
--       Returns 404 when the room does not exist.
--
--   GET /room?room=<name>&domain=<base>[&subdomain=<sub>][&token=<jwt>]
--       Returns a JSON array of occupant objects {jid, email, display_name},
--       excluding the hidden Jitsi focus participant.
--       Returns 404 when the room does not exist.
--
--   GET /sessions
--       Returns the total number of active Prosody client sessions as a plain
--       integer string.
--
-- The room address is built as <room>@<muc_domain_prefix>.<domain>, optionally
-- prefixed with [<subdomain>] for multi-tenant deployments.
-- Token-based JWT verification is optional and controlled by the
-- enable_roomsize_token_verification module option (default: false).

local jid = require "util.jid";
local it = require "util.iterators";
local json = require 'cjson.safe';
local iterators = require "util.iterators";
local array = require"util.array";

local have_async = pcall(require, "util.async");
if not have_async then
    module:log("error", "requires a version of Prosody with util.async");
    return;
end

-- muc_domain_prefix is needed by the build_room_address fallback below.
local muc_domain_prefix
    = module:get_option_string("muc_mapper_domain_prefix", "conference");

-- Load shared utility library. If it fails (e.g. a transitive dependency is
-- missing in the current environment) log the error and fall back to inline
-- implementations so the HTTP routes are always registered.
local async_handler_wrapper, get_room_from_jid, build_room_address, is_focus;
local ok_util, util_or_err = pcall(function() return module:require "util" end);
if ok_util then
    local util = util_or_err;
    async_handler_wrapper = util.async_handler_wrapper;
    get_room_from_jid    = util.get_room_from_jid;
    build_room_address   = util.build_room_address;
    is_focus             = util.is_focus;
else
    module:log("warn", "mod_muc_size: util.lib.lua unavailable (%s); using inline fallbacks",
        tostring(util_or_err));
    async_handler_wrapper = function(_, handler) return handler(_) end;
    get_room_from_jid = function(room_jid)
        local _, host = jid.split(room_jid);
        local component = hosts[host];
        if component then
            local muc = component.modules.muc;
            if muc then return muc.get_room_from_jid(room_jid) end
        end
    end;
    build_room_address = function(room_name, domain_name, subdomain)
        local addr = jid.join(room_name, muc_domain_prefix.."."..domain_name);
        if subdomain and subdomain ~= "" then
            addr = "["..subdomain.."]"..addr;
        end
        return addr;
    end;
    is_focus = function(nick)
        return string.sub(nick, -string.len("/focus")) == "/focus";
    end;
end

local tostring = tostring;

-- Simple query-string parser: "room=foo&domain=bar" → { room="foo", domain="bar" }.
-- Avoids a dependency on the optional third-party net.url LuaRocks module.
local function parse(q)
    local t = {};
    for k, v in (q or ""):gmatch("([^=&]+)=([^&]*)") do
        t[k] = v;
    end
    return t;
end

-- option to enable/disable room API token verifications
local enableTokenVerification
    = module:get_option_boolean("enable_roomsize_token_verification", false);

local ok, token_util_mod = pcall(function() return module:require "token/util" end);
local token_util = ok and token_util_mod and token_util_mod.new(module) or nil;

-- no token configuration but required
if token_util == nil and enableTokenVerification then
    log("error", "no token configuration but it is required");
    return;
end

--- Verifies room name, domain name with the values in the token
-- @param token the token we received
-- @param room_address the full room address jid
-- @return true if values are ok or false otherwise
function verify_token(token, room_address)
    if not enableTokenVerification then
        return true;
    end

    -- if enableTokenVerification is enabled and we do not have token
    -- stop here, cause the main virtual host can have guest access enabled
    -- (allowEmptyToken = true) and we will allow access to rooms info without
    -- a token
    if token == nil then
        log("warn", "no token provided");
        return false;
    end

    local session = {};
    session.auth_token = token;
    local verified, reason = token_util:process_and_verify_token(session);
    if not verified then
        log("warn", "not a valid token %s", tostring(reason));
        return false;
    end

    if not token_util:verify_room(session, room_address) then
        log("warn", "Token %s not allowed to join: %s",
            tostring(token), tostring(room_address));
        return false;
    end

    return true;
end

--- Handles request for retrieving the room size
-- @param event the http event, holds the request query
-- @return GET response, containing a json with participants count,
--         the value is without counting the focus.
function handle_get_room_size(event)
    if (not event.request.url.query) then
        return { status_code = 400; };
    end

    local params = parse(event.request.url.query);
    local room_name = params["room"];
    local domain_name = params["domain"];
    local subdomain = params["subdomain"];

    local room_address = build_room_address(room_name, domain_name, subdomain);

    if not verify_token(params["token"], room_address) then
        return { status_code = 403; };
    end

    local room = get_room_from_jid(room_address);
    local participant_count = 0;

    log("debug", "Querying room %s", tostring(room_address));

    if room then
        local occupants = room._occupants;
        if occupants then
            participant_count = iterators.count(room:each_occupant());
        end
        log("debug",
            "there are %s occupants in room", tostring(participant_count));
    else
        log("debug", "no such room exists");
        return { status_code = 404; };
    end

    if participant_count > 1 then
        participant_count = participant_count - 1;
    end

    return { status_code = 200; body = [[{"participants":]]..participant_count..[[}]] };
end

--- Handles request for retrieving the room participants details
-- @param event the http event, holds the request query
-- @return GET response, containing a json with participants details
function handle_get_room (event)
    if (not event.request.url.query) then
        return { status_code = 400; };
    end

    local params = parse(event.request.url.query);
    local room_name = params["room"];
    local domain_name = params["domain"];
    local subdomain = params["subdomain"];

    local room_address = build_room_address(room_name, domain_name, subdomain);

    if not verify_token(params["token"], room_address) then
        return { status_code = 403; };
    end

    local room = get_room_from_jid(room_address);
    local participant_count = 0;
    local occupants_json = array();

    log("debug", "Querying room %s", tostring(room_address));

    if room then
        local occupants = room._occupants;
        if occupants then
            participant_count = iterators.count(room:each_occupant());
            for _, occupant in room:each_occupant() do
                -- filter focus as we keep it as hidden participant
                if not is_focus(occupant.nick) then
                    for _, pr in occupant:each_session() do
                        local nick = pr:get_child_text("nick", "http://jabber.org/protocol/nick") or "";
                        local email = pr:get_child_text("email") or "";
                        occupants_json:push({
                            jid = tostring(occupant.nick),
                            email = tostring(email),
                            display_name = tostring(nick)});
                    end
                end
            end
        end
        log("debug",
            "there are %s occupants in room", tostring(participant_count));
    else
        log("debug", "no such room exists");
        return { status_code = 404; };
    end

    if participant_count > 1 then
        participant_count = participant_count - 1;
    end

    return { status_code = 200; body = json.encode(occupants_json); };
end;

module:provides("http", {
    default_path = "/";
    route = {
        ["GET /room-size"] = function (event) return async_handler_wrapper(event,handle_get_room_size) end;
        ["GET /sessions"] = function () return tostring(it.count(it.keys(prosody.full_sessions))); end;
        ["GET /room"] = function (event) return async_handler_wrapper(event,handle_get_room) end;
    };
});
