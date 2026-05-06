-- Test-only module. Never load in production.
-- Serves HTTP endpoints for test assertions. Must be loaded on the main VirtualHost
-- (not the MUC component) so that plain HTTP on port 5280 is reachable with
-- Host: localhost — the VirtualHost's domain.
--
-- Data is supplied by mod_test_observer (loaded on the MUC component) via
-- module:shared. Load order does not matter; shared tables are created lazily.
--
-- Also serves a mock access manager endpoint for mod_muc_auth_ban tests:
--   GET  /test-observer/access-manager  — called by Prosody; returns configured response
--   POST /test-observer/access-manager  — called by tests to configure the response

local json    = require "cjson.safe";
local io      = require "io";
local jid_lib = require "util.jid";

-- Mock access-manager state for mod_muc_auth_ban tests.
--   access: true  → return {"access": true}  (user allowed)
--   access: false → return {"access": false} (user banned)
--   status: any non-200 value → return that HTTP status code with no JSON body
--     (simulates HTTP errors; mod_muc_auth_ban fails open on non-200)
-- Reset to the default (allow, 200) between tests via POST /test-observer/access-manager.
local access_manager_state = { access = true, status = 200 };

-- ASAP public key servers: serve test RSA public keys so that Prosody can
-- fetch them when verifying RS256 tokens signed by the matching private keys.
-- util.lib.lua constructs the URL as: <asap_key_server>/<sha256hex(kid)>.pem
--
-- Two separate key pairs are used:
--   Login tokens  (kid "test-asap-key"):        signed by the login key pair,
--                                                served at /test-observer/asap-keys/
--                                                used by mod_auth_token (VirtualHost "localhost")
--   System tokens (kid "test-system-asap-key"): signed by the system key pair,
--                                                served at /test-observer/system-asap-keys/
--                                                used by mod_muc_end_meeting and similar HTTP API modules
local ASAP_KEY_PATH = "/opt/prosody-jitsi-plugins/test-asap-public.pem";
local ASAP_KID_SHA256 = "dc6983da8e703a3f51d4c1cb92b52c982f7853ce3d5ba20c782fcd13616f6dfc";

local SYSTEM_ASAP_KEY_PATH = "/opt/prosody-jitsi-plugins/test-system-asap-public.pem";
local SYSTEM_ASAP_KID_SHA256 = "e76ed986a75a90756e5add6e8b56efc3d3f027764436d2744d29a33f0ec24fea";

local function load_pem(path)
    local f = io.open(path, "r");
    if not f then return nil; end
    local data = f:read("*all");
    f:close();
    return data;
end

local asap_public_key = load_pem(ASAP_KEY_PATH);
if asap_public_key then
    module:log("info", "Loaded test ASAP public key from %s", ASAP_KEY_PATH);
else
    module:log("warn", "Test ASAP public key not found at %s; login ASAP key-server routes will 404", ASAP_KEY_PATH);
end

local system_asap_public_key = load_pem(SYSTEM_ASAP_KEY_PATH);
if system_asap_public_key then
    module:log("info", "Loaded test system ASAP public key from %s", SYSTEM_ASAP_KEY_PATH);
else
    module:log("warn", "Test system ASAP public key not found at %s; system ASAP key-server routes will 404", SYSTEM_ASAP_KEY_PATH);
end

-- session-info: capture mod_jitsi_session / mod_auth_token fields after
-- resource-bind so tests can assert URL query params and JWT claims were
-- stored correctly on the session object.
local session_info = {}; -- full_jid -> field snapshot

local function capture_session_info(event)
    local session = event.session;
    local jid = session.full_jid;
    if jid then
        session_info[jid] = {
            previd = session.previd,
            customusername = session.customusername,
            jitsi_web_query_room = session.jitsi_web_query_room,
            jitsi_web_query_prefix = session.jitsi_web_query_prefix,
            auth_token = session.auth_token,
            user_region = session.user_region,
            user_agent_header = session.user_agent_header,
            -- Fields set by mod_auth_token after JWT verification:
            jitsi_meet_room = session.jitsi_meet_room,
            jitsi_meet_context_user = session.jitsi_meet_context_user,
            jitsi_meet_context_group = session.jitsi_meet_context_group,
            jitsi_meet_context_features = session.jitsi_meet_context_features,
        };
    end
end

-- resource-bind fires on each VirtualHost's own event bus, not globally.
-- Register on every host already active at module load time, and on any host
-- that activates later (e.g. hs256.localhost loads after localhost since
-- VirtualHosts are initialized in config order).
local function register_on_host(host_obj)
    if host_obj and host_obj.events then
        host_obj.events.add_handler("resource-bind", capture_session_info, 10);
    end
end

for _, host_obj in pairs(prosody.hosts) do
    register_on_host(host_obj);
end

-- host-activated passes the hostname string directly (not a table).
module:hook_global("host-activated", function(host)
    register_on_host(prosody.hosts[host]);
end);

-- /conference.localhost/mod_test_observer is the absolute path for the shared
-- table created by mod_test_observer running on conference.localhost.
local MUC_HOST = module:get_option_string("muc_mapper_domain_base", "localhost");
local MUC_COMPONENT = module:get_option_string("muc_mapper_domain_prefix", "conference") .. "." .. MUC_HOST;
local shared = module:shared("/" .. MUC_COMPONENT .. "/mod_test_observer");

local function urldecode(s)
    return (s:gsub("%%(%x%x)", function(hex)
        return string.char(tonumber(hex, 16));
    end));
end

local function parse_query(q)
    local params = {};
    for k, v in (q or ""):gmatch("([^&=]+)=([^&]*)") do
        params[urldecode(k)] = urldecode(v);
    end
    return params;
end

module:provides("http", {
    default_path = "/test-observer";
    route = {
        -- GET /test-observer/asap-keys/<sha256hex(kid)>.pem
        -- Returns the login RSA public key PEM so mod_auth_token can verify RS256 login tokens.
        -- kid must be "test-asap-key" (its SHA256 hex is the filename).
        ["GET /asap-keys/"..ASAP_KID_SHA256..".pem"] = function()
            if not asap_public_key then
                return { status_code = 404; body = "key not found" };
            end
            return {
                status_code = 200;
                headers = { ["Content-Type"] = "application/x-pem-file" };
                body = asap_public_key;
            };
        end;

        -- GET /test-observer/system-asap-keys/<sha256hex(kid)>.pem
        -- Returns the system RSA public key PEM for mod_muc_end_meeting and similar
        -- system HTTP API modules that use prosody_password_public_key_repo_url.
        -- kid must be "test-system-asap-key" (its SHA256 hex is the filename).
        ["GET /system-asap-keys/"..SYSTEM_ASAP_KID_SHA256..".pem"] = function()
            if not system_asap_public_key then
                return { status_code = 404; body = "key not found" };
            end
            return {
                status_code = 200;
                headers = { ["Content-Type"] = "application/x-pem-file" };
                body = system_asap_public_key;
            };
        end;

        ["GET /events"] = function()
            local events = shared.events or {};
            -- cjson encodes an empty Lua table as {} (object); force array literal.
            local body = #events == 0 and "[]" or json.encode(events);
            return {
                status_code = 200;
                headers = { ["Content-Type"] = "application/json" };
                body = body;
            };
        end;

        ["DELETE /events"] = function()
            -- Replace with a fresh table; mod_test_observer always reads shared.events
            -- via the shared reference so it will see the new table immediately.
            shared.events = {};
            return { status_code = 204 };
        end;

        -- GET /test-observer/jibri-iqs
        -- Returns the list of Jibri IQs that reached the MUC (i.e. passed mod_filter_iq_jibri).
        ["GET /jibri-iqs"] = function()
            local iqs = shared.jibri_iqs or {};
            local body = #iqs == 0 and "[]" or json.encode(iqs);
            return {
                status_code = 200;
                headers = { ["Content-Type"] = "application/json" };
                body = body;
            };
        end;

        -- DELETE /test-observer/jibri-iqs
        -- Clears the recorded Jibri IQ list. Call before each test.
        ["DELETE /jibri-iqs"] = function()
            shared.jibri_iqs = {};
            return { status_code = 204 };
        end;

        -- GET /test-observer/dial-iqs
        -- Returns the list of Rayo dial IQs that reached the MUC (i.e. passed mod_filter_iq_rayo).
        ["GET /dial-iqs"] = function()
            local iqs = shared.dial_iqs or {};
            local body = #iqs == 0 and "[]" or json.encode(iqs);
            return {
                status_code = 200;
                headers = { ["Content-Type"] = "application/json" };
                body = body;
            };
        end;

        -- DELETE /test-observer/dial-iqs
        -- Clears the recorded Rayo dial IQ list. Call before each test.
        ["DELETE /dial-iqs"] = function()
            shared.dial_iqs = {};
            return { status_code = 204 };
        end;

        -- POST /test-observer/sessions/context
        -- Body: { "jid": "node@localhost/resource", "user_id": "...", "features": { "flip": true } }
        -- Sets jitsi_meet_context_user / jitsi_meet_context_features on the c2s session so that
        -- mod_muc_flip (and other JWT-aware modules) see the same context as they would with a
        -- real token — without needing a JWT auth module in the test setup.
        ["POST /sessions/context"] = function(event)
            local data     = json.decode(event.request.body or "{}") or {};
            local full_jid = data.jid;
            local user_id  = data.user_id;
            local features = data.features or {};
            if not full_jid then
                return { status_code = 400; body = '{"error":"missing jid"}' };
            end
            local node, host, resource = jid_lib.split(full_jid);
            local host_obj = host and prosody.hosts[host];
            if not host_obj then
                return { status_code = 404; body = '{"error":"host not found"}' };
            end
            local user_obj = host_obj.sessions and host_obj.sessions[node];
            if not user_obj then
                return { status_code = 404; body = '{"error":"user not found"}' };
            end
            local session = user_obj.sessions and user_obj.sessions[resource];
            if not session then
                return { status_code = 404; body = '{"error":"session not found"}' };
            end
            if user_id then
                session.jitsi_meet_context_user = { id = user_id };
            end
            session.jitsi_meet_context_features = features;
            return {
                status_code = 200;
                headers = { ["Content-Type"] = "application/json" };
                body = '{"ok":true}';
            };
        end;

        -- GET /test-observer/sessions/features?jid=user@localhost/resource
        -- Returns the live jitsi_meet_context_features for the session.
        -- Reading live (not a snapshot) captures side-effects from modules such as
        -- mod_jitsi_permissions, which may set or update features after resource-bind.
        -- Returns 200 {"features": <object|null>} or 404.
        ["GET /sessions/features"] = function(event)
            local params = parse_query(event.request.url.query);
            local full_jid = params["jid"];
            if not full_jid then
                return { status_code = 400; body = '{"error":"missing jid param"}' };
            end
            local node, host, resource = jid_lib.split(full_jid);
            local host_obj = host and prosody.hosts[host];
            if not host_obj then
                return { status_code = 404; body = '{"error":"host not found"}' };
            end
            local user_obj = host_obj.sessions and host_obj.sessions[node];
            if not user_obj then
                return { status_code = 404; body = '{"error":"user not found"}' };
            end
            local session = user_obj.sessions and user_obj.sessions[resource];
            if not session then
                return { status_code = 404; body = '{"error":"session not found"}' };
            end
            local features = session.jitsi_meet_context_features;
            local body = features and json.encode({ features = features }) or '{"features":null}';
            return {
                status_code = 200;
                headers = { ["Content-Type"] = "application/json" };
                body = body;
            };
        end;

        -- GET /test-observer/rooms/participants?jid=room@conference.localhost
        -- Returns: { participants_details: { userId: fullNick }, kicked_participant_nick?, flip_participant_nick? }
        -- Exposes mod_muc_flip's per-room tracking tables for test assertions.
        ["GET /rooms/participants"] = function(event)
            local params   = parse_query(event.request.url.query);
            local room_jid = params["jid"];
            if not room_jid then
                return { status_code = 400; body = '{"error":"missing jid param"}' };
            end
            local room = (shared.rooms or {})[room_jid];
            if not room then
                return { status_code = 404; body = '{"error":"room not found"}' };
            end
            local result = { participants_details = room._data.participants_details or {} };
            if room._data.kicked_participant_nick ~= nil then
                result.kicked_participant_nick = room._data.kicked_participant_nick;
            end
            if room._data.flip_participant_nick ~= nil then
                result.flip_participant_nick = room._data.flip_participant_nick;
            end
            return {
                status_code = 200;
                headers = { ["Content-Type"] = "application/json" };
                body = json.encode(result);
            };
        end;

        -- POST /test-observer/rooms/max-occupants
        -- Body: { "jid": "room@conference.localhost", "max_occupants": 4 }
        -- Sets room._data.max_occupants so per-room limit tests can override the
        -- global muc_max_occupants without restarting Prosody.
        ["POST /rooms/max-occupants"] = function(event)
            local data = json.decode(event.request.body or "{}") or {};
            local room_jid = data.jid;
            local max = tonumber(data.max_occupants);
            if not room_jid or not max then
                return { status_code = 400; body = '{"error":"missing jid or max_occupants"}' };
            end
            local room = (shared.rooms or {})[room_jid];
            if not room then
                return { status_code = 404; body = '{"error":"room not found"}' };
            end
            room._data.max_occupants = max;
            return {
                status_code = 200;
                headers = { ["Content-Type"] = "application/json" };
                body = '{"ok":true}';
            };
        end;

        -- GET /test-observer/access-manager
        -- Mock access-manager endpoint called by mod_muc_auth_ban.
        -- Returns {"access": true} or {"access": false} based on the current
        -- access_manager_state, or a non-200 status to simulate HTTP errors.
        -- The real access manager receives `Authorization: Bearer <token>` but
        -- this mock ignores it and returns the globally configured response.
        ["GET /access-manager"] = function()
            if access_manager_state.status ~= 200 then
                return { status_code = access_manager_state.status; body = "error" };
            end
            return {
                status_code = 200;
                headers = { ["Content-Type"] = "application/json" };
                body = json.encode({ access = access_manager_state.access });
            };
        end;

        -- POST /test-observer/access-manager
        -- Body: { "access": true|false, "status": <http-status-code> }
        -- Configures what the mock access manager returns.
        -- Call this from tests before connecting the client under test.
        -- Call with { "access": true, "status": 200 } to reset to the default.
        ["POST /access-manager"] = function(event)
            local data = json.decode(event.request.body or "{}") or {};
            if data.access ~= nil then
                access_manager_state.access = data.access;
            end
            if data.status ~= nil then
                access_manager_state.status = tonumber(data.status) or 200;
            end
            return { status_code = 204 };
        end;

        -- GET /test-observer/session-info?jid=user@localhost/resource
        -- Returns the mod_jitsi_session fields captured at resource-bind time.
        ["GET /session-info"] = function(event)
            local params = parse_query(event.request.url.query);
            local jid = params["jid"];
            if not jid then
                return { status_code = 400; body = '{"error":"missing jid param"}' };
            end
            local info = session_info[jid];
            if not info then
                return { status_code = 404; body = '{"error":"session not found"}' };
            end
            return {
                status_code = 200;
                headers = { ["Content-Type"] = "application/json" };
                body = json.encode(info);
            };
        end;

        -- POST /test-observer/rooms/lobby
        -- Body: { "jid": "room@conference.localhost", "enabled": true|false }
        -- Enables or disables the lobby for the given room by firing the
        -- create-lobby-room / destroy-lobby-room global Prosody events.
        -- Enabling also sets members-only; disabling unsets it.
        -- Response: { ok, lobbyroom } (lobbyroom is nil when disabling).
        ["POST /rooms/lobby"] = function(event)
            local data = json.decode(event.request.body or "{}") or {};
            local room_jid = data.jid;
            local enabled = data.enabled;
            if not room_jid then
                return { status_code = 400; body = '{"error":"missing jid"}' };
            end
            local room = (shared.rooms or {})[room_jid];
            if not room then
                return { status_code = 404; body = '{"error":"room not found"}' };
            end
            if enabled then
                prosody.events.fire_event('create-lobby-room', { room = room });
            else
                room:set_members_only(false);
                prosody.events.fire_event('destroy-lobby-room', { room = room });
            end
            return {
                status_code = 200;
                headers = { ["Content-Type"] = "application/json" };
                body = json.encode({ ok = true; lobbyroom = room._data.lobbyroom });
            };
        end;

        -- POST /test-observer/rooms/affiliation
        -- Body: { "jid": "room@conference.localhost", "occupant_jid": "user@localhost", "affiliation": "member" }
        -- Sets the affiliation of occupant_jid in the given room.
        ["POST /rooms/affiliation"] = function(event)
            local data = json.decode(event.request.body or "{}") or {};
            local room_jid = data.jid;
            local occupant_jid = data.occupant_jid;
            local affiliation = data.affiliation;
            if not room_jid or not occupant_jid or not affiliation then
                return { status_code = 400; body = '{"error":"missing required fields"}' };
            end
            local room = (shared.rooms or {})[room_jid];
            if not room then
                return { status_code = 404; body = '{"error":"room not found"}' };
            end
            room:set_affiliation(true, occupant_jid, affiliation);
            return {
                status_code = 200;
                headers = { ["Content-Type"] = "application/json" };
                body = '{"ok":true}';
            };
        end;

        -- GET /test-observer/rooms/metadata?jid=room@conference.localhost
        -- Returns: { jid, metadata } where metadata is room.jitsiMetadata.
        ["GET /rooms/metadata"] = function(event)
            local params = parse_query(event.request.url.query);
            local room_jid = params["jid"];
            if not room_jid then
                return { status_code = 400; body = '{"error":"missing jid param"}' };
            end
            local rooms = shared.rooms or {};
            local room = rooms[room_jid];
            if not room then
                return { status_code = 404; body = '{"error":"room not found"}' };
            end
            local encoded, err = json.encode({
                jid = room.jid;
                metadata = room.jitsiMetadata or {};
            });
            if not encoded then
                return { status_code = 500; body = json.encode({ error = 'encode failed: ' .. tostring(err) }) };
            end
            return {
                status_code = 200;
                headers = { ["Content-Type"] = "application/json" };
                body = encoded;
            };
        end;

        -- GET /test-observer/rooms?jid=room@conference.localhost
        -- Returns: { jid, hidden, occupant_count }
        ["GET /rooms"] = function(event)
            local params = parse_query(event.request.url.query);
            local room_jid = params["jid"];
            if not room_jid then
                return { status_code = 400; body = '{"error":"missing jid param"}' };
            end
            local rooms = shared.rooms or {};
            local room = rooms[room_jid];
            if not room then
                return { status_code = 404; body = '{"error":"room not found"}' };
            end
            local count = 0;
            for _ in room:each_occupant() do count = count + 1; end
            return {
                status_code = 200;
                headers = { ["Content-Type"] = "application/json" };
                body = json.encode({
                    jid = room.jid;
                    hidden = room:get_hidden();
                    occupant_count = count;
                });
            };
        end;
    };
});

module:log("info", "test_observer_http loaded");
