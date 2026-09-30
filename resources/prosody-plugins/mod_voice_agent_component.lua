-- mod_voice_agent_component.lua
--
-- HTTP module that provisions voice agents (bot participants) for a room.
-- Intended for internal system use (the JaaS provisioning API), not for
-- end-user clients — the same trust model as mod_muc_jigasi_invite.
--
-- A voice agent is not a MUC occupant: its presence is advertised to clients
-- through room metadata (the 'agents' key), and its media runs bridge-side (a
-- synthetic colibri2 endpoint jicofo allocates when it sees the agent in the
-- admin-only metadata). Clients render the roster entry from the metadata and,
-- after user consent, subscribe to the agent's audio source by name.
--
-- ── State ─────────────────────────────────────────────────────────────────────
-- Client-facing (broadcast to all occupants via mod_room_metadata_component):
--   room.jitsiMetadata.agents[agentId] = {
--       kind = 'agent', displayName = <string>, sourceName = '<agentId>-a0',
--       state = provisioning|connecting|active|failed
--   }
-- Jicofo-only (never broadcast; merged into the admin metadata payload through
-- the 'jitsi-room-metadata-admin-extra' hook):
--   room._data.voice_agents[agentId] = { urlParams, httpHeaders, customParameters, callbackUrl }
-- jicofo receives urlParams ∪ customParameters as the dial urlParams (explicit
-- urlParams win) plus httpHeaders (carrying the X-Agent-* endpoint headers);
-- customParameters reach the agent as the media-dial query (echoed in
-- info/start). callbackUrl never leaves prosody.
--
-- ── Endpoints (contract frozen at v1.0 — see AGENT_REST_API.md) ───────────────
-- Authentication: Authorization: Bearer <system ASAP token>, verified against
-- prosody_password_public_key_repo_url (NOT login tokens), exactly like
-- mod_muc_jigasi_invite.
--
--   POST /voice-agent/invite   { conference, displayName, agentId?, endpoint?{url,authorization},
--                                urlParams?, httpHeaders?, customParameters?, callbackUrl? }
--     → 200 { agentId, sourceName }  — idempotent on agentId: an identical re-invite
--       returns the existing agent, a different one is 409
--   POST /voice-agent/dismiss  { conference, agentId } → 200 { agentId }
--   GET  /voice-agent/list?conference=<jid> → 200 { agents = { <agentId>: <client fields> } }
--   GET  /voice-agent/get?conference=<jid>&agentId=<id> → 200 <agent> | 404
--   POST /voice-agent/status   { conference, agentId, state, reason? }
--     internal: jicofo/JVB advance the lifecycle (connecting|active|failed|ended);
--     active → agent.connected, failed → agent.failed, ended → teardown + agent.ended
--     auth: ASAP, or the voice_agent_status_secret shared secret (jicofo cannot mint ASAP)
--
-- Webhooks: when an agent has a callbackUrl, lifecycle events are POSTed to it as
-- { event, agentId, conference, sourceName, state, timestamp, reason? }, signed
-- X-Agent-Signature: sha256=<hmac> with voice_agent_webhook_secret, retried with
-- backoff up to voice_agent_webhook_retries times (at-least-once).
--
-- Copyright (C) 2026-present 8x8, Inc.

local hashes = require 'util.hashes';
local random = require 'util.random';
local json = require 'cjson.safe';
local http_util = require 'util.http';
local http = require 'net.http';

local util = module:require 'util';
local async_handler_wrapper = util.async_handler_wrapper;
local get_room_from_jid = util.get_room_from_jid;
local is_healthcheck_room = util.is_healthcheck_room;
local process_host_module = util.process_host_module;
local room_jid_match_rewrite = util.room_jid_match_rewrite;
local starts_with = util.starts_with;
local table_shallow_copy = util.table_shallow_copy;

local muc_component_host = module:get_option_string('muc_component');
if muc_component_host == nil then
    module:log('error', 'No muc_component specified. No muc to operate on!');
    return;
end

local JSON_CONTENT_TYPE = 'application/json';

-- Caps keeping a single provisioning request from bloating room state and the
-- metadata broadcastable payload.
local MAX_AGENTS_PER_ROOM = module:get_option_number('voice_agent_max_agents', 5);
local MAX_PARAM_ENTRIES = 16;
local MAX_PARAM_KEY_LENGTH = 128;
local MAX_PARAM_VALUE_LENGTH = 2048;
local MAX_DISPLAY_NAME_LENGTH = 256;
local MAX_CALLBACK_URL_LENGTH = 2048;

-- Reserved namespace for agent ids, so an agent id can never equal a real participant's endpoint id.
local AGENT_ID_PREFIX = 'agent-';

-- The proxy-facing connect headers the optional 'endpoint' convenience object
-- maps to (see opus-transcriber-proxy resolveAgentEndpoint).
local ENDPOINT_URL_HEADER = 'X-Agent-Endpoint';
local ENDPOINT_AUTH_HEADER = 'X-Agent-Authorization';

-- Lifecycle states; 'ended' is terminal and removes the agent.
local STATE_PROVISIONING = 'provisioning';
local STATE_CONNECTING = 'connecting';
local STATE_ACTIVE = 'active';
local STATE_FAILED = 'failed';
local STATE_ENDED = 'ended';
-- Forward-only lifecycle: a report only ever moves the state forward, so a duplicate or a stale retry
-- (a delayed 'connecting' landing after 'active') is acknowledged and ignored and each webhook fires once.
local STATE_RANK = {
    [STATE_PROVISIONING] = 0; [STATE_CONNECTING] = 1; [STATE_ACTIVE] = 2; [STATE_FAILED] = 3; [STATE_ENDED] = 3;
};
local STATUS_TRANSITIONS = {
    [STATE_CONNECTING] = true; [STATE_ACTIVE] = true; [STATE_FAILED] = true; [STATE_ENDED] = true;
};

local invite_count = module:measure('voice_agent_invite_rate', 'rate');
local invite_success_count = module:measure('voice_agent_invite_success', 'rate');
local dismiss_count = module:measure('voice_agent_dismiss_rate', 'rate');

-- DEV ONLY: skip provisioning-token auth (no ASAP keyserver). Default false; never enable where
-- untrusted callers can reach it.
local INSECURE_SKIP_AUTH = module:get_option_boolean('voice_agent_insecure_skip_auth', false);

-- DEV ONLY: allow a ws:// (cleartext) endpoint.url for local test rigs; prod always requires wss://.
local INSECURE_ALLOW_WS_ENDPOINT = module:get_option_boolean('voice_agent_insecure_allow_ws_endpoint', false);

-- DEV ONLY: allow an http:// callbackUrl for local rigs; prod always requires https://.
local INSECURE_ALLOW_HTTP_CALLBACK = module:get_option_boolean('voice_agent_insecure_allow_http_callback', false);

local WEBHOOK_SECRET = module:get_option_string('voice_agent_webhook_secret', '');
local WEBHOOK_RETRIES = module:get_option_number('voice_agent_webhook_retries', 3);
if WEBHOOK_SECRET == '' then
    module:log('warn', 'voice_agent_webhook_secret is not set — lifecycle webhooks will be UNSIGNED');
end

-- Shared secret jicofo presents on /voice-agent/status (it cannot mint ASAP tokens); ASAP is still accepted.
local STATUS_SECRET = module:get_option_string('voice_agent_status_secret', '');

local ASAP_KEY_SERVER = module:get_option_string('prosody_password_public_key_repo_url', '');
local token_util;
if INSECURE_SKIP_AUTH then
    module:log('warn', 'voice_agent_insecure_skip_auth is ON — /voice-agent endpoints are UNAUTHENTICATED');
else
    token_util = module:require 'token/util'.new(module);
    -- Empty string is truthy in Lua, so compare explicitly.
    if ASAP_KEY_SERVER ~= '' then
        token_util:set_asap_key_server(ASAP_KEY_SERVER);
    end
end

local main_muc_module;

process_host_module(muc_component_host, function(host_module)
    main_muc_module = host_module;
end);

local function is_token_valid(token)
    if token == nil then
        module:log('warn', 'no token provided');
        return false;
    end

    local session = {};
    session.auth_token = token;
    local verified, reason, msg = token_util:process_and_verify_token(session);
    if not verified then
        module:log('warn', 'not a valid token %s %s', tostring(reason), tostring(msg));
        return false;
    end
    return true;
end

-- Verifies the Authorization header; returns nil when authorized, or the error response.
local function check_authorization(request)
    if INSECURE_SKIP_AUTH then
        return nil;
    end
    local token = request.headers['authorization'];
    if not token then
        module:log('warn', 'Authorization header was not provided');
        return { status_code = 401 };
    end
    if starts_with(token, 'Bearer ') then
        token = token:sub(8, #token);
    else
        module:log('warn', 'Authorization header is invalid');
        return { status_code = 401 };
    end
    if not is_token_valid(token) then
        return { status_code = 401 };
    end
    return nil;
end

-- Constant-time secret comparison: HMACs under a per-load random key have a fixed length and leak nothing about
-- where a mismatch occurs, unlike a plain string compare.
local COMPARE_KEY = random.bytes(16);
local function secrets_equal(a, b)
    return hashes.hmac_sha256(COMPARE_KEY, a, true) == hashes.hmac_sha256(COMPARE_KEY, b, true);
end

-- The status route is called by jicofo, which cannot mint ASAP tokens: accept the configured shared secret as a
-- bearer there, in addition to a regular ASAP token. Never used for the provisioning routes.
local function check_status_authorization(request)
    if STATUS_SECRET ~= '' then
        local token = request.headers['authorization'];
        if type(token) == 'string' and starts_with(token, 'Bearer ') and secrets_equal(token:sub(8), STATUS_SECRET) then
            return nil;
        end
    end
    return check_authorization(request);
end

local function error_response(status_code, message)
    return { status_code = status_code, body = json.encode({ error = message }) };
end

-- Reads a JSON request body; returns the payload, or nil plus the error response.
local function parse_json_request(request)
    if request.headers.content_type ~= JSON_CONTENT_TYPE or (not request.body or #request.body == 0) then
        module:log('warn', 'Wrong content type: %s or missing payload', request.headers.content_type);
        return nil, { status_code = 400 };
    end
    local payload, decode_error = json.decode(request.body);
    if not payload then
        module:log('warn', 'Cannot decode json error:%s', decode_error);
        return nil, { status_code = 400 };
    end
    return payload;
end

-- Validates a string->string map (urlParams / httpHeaders / customParameters); returns a bounded
-- copy, or nil plus an error message.
local function validate_string_map(value, name)
    if value == nil then
        return nil;
    end
    if type(value) ~= 'table' then
        return nil, name .. ' must be an object';
    end
    local copy = {};
    local entries = 0;
    for k, v in pairs(value) do
        if type(k) ~= 'string' or type(v) ~= 'string' then
            return nil, name .. ' must map strings to strings';
        end
        if #k > MAX_PARAM_KEY_LENGTH then
            return nil, name .. ' key too long';
        end
        if #v > MAX_PARAM_VALUE_LENGTH then
            return nil, name .. ' value too long';
        end
        -- These become outbound HTTP header / URL-param content on the dial leg; reject control chars
        -- (CR/LF) so a value cannot split or inject headers.
        if k:find('[%c]') or v:find('[%c]') then
            return nil, name .. ' must not contain control characters';
        end
        entries = entries + 1;
        if entries > MAX_PARAM_ENTRIES then
            return nil, name .. ' has too many entries';
        end
        copy[k] = v;
    end
    return copy;
end

local function is_valid_display_name(name)
    return type(name) == 'string' and name ~= '' and #name <= MAX_DISPLAY_NAME_LENGTH;
end

-- Validates callbackUrl: https:// (http:// only with the dev flag), bounded, no control chars.
local function validate_callback_url(url)
    if url == nil then
        return nil;
    end
    if type(url) ~= 'string' or url == '' or #url > MAX_CALLBACK_URL_LENGTH or url:find('[%c]') then
        return nil, 'Invalid callbackUrl';
    end
    if not (starts_with(url, 'https://') or (INSECURE_ALLOW_HTTP_CALLBACK and starts_with(url, 'http://'))) then
        return nil, 'callbackUrl must be an https:// URL';
    end
    return url;
end

-- Validates endpoint.{url,authorization}; returns the X-Agent-* headers it maps to, or nil plus an
-- error. Enforces the wss:// scheme only; host-level SSRF filtering is done downstream by the
-- opus-transcriber-proxy endpoint guard.
local function validate_endpoint(endpoint)
    if type(endpoint) ~= 'table' or type(endpoint.url) ~= 'string'
            or not (starts_with(endpoint.url, 'wss://')
                or (INSECURE_ALLOW_WS_ENDPOINT and starts_with(endpoint.url, 'ws://'))) then
        return nil, 'endpoint.url must be a wss:// URL';
    end
    local headers = { [ENDPOINT_URL_HEADER] = endpoint.url };
    if type(endpoint.authorization) == 'string' then
        headers[ENDPOINT_AUTH_HEADER] = endpoint.authorization;
    end
    return headers;
end

-- The proxy-facing X-Agent-* headers may only be set through the wss-validated endpoint object,
-- never as raw httpHeaders (which would bypass the scheme check).
local function has_reserved_header(headers)
    return headers ~= nil and (headers[ENDPOINT_URL_HEADER] ~= nil or headers[ENDPOINT_AUTH_HEADER] ~= nil);
end

-- Shallow equality for string maps; nil and {} compare equal.
local function maps_equal(a, b)
    a = a or {};
    b = b or {};
    for k, v in pairs(a) do
        if b[k] ~= v then
            return false;
        end
    end
    for k in pairs(b) do
        if a[k] == nil then
            return false;
        end
    end
    return true;
end

-- The urlParams jicofo templates into the media dial URL: customParameters overridden by explicit urlParams.
local function dial_url_params(jicofo_entry)
    if jicofo_entry.urlParams == nil and jicofo_entry.customParameters == nil then
        return nil;
    end
    local merged = {};
    for k, v in pairs(jicofo_entry.customParameters or {}) do
        merged[k] = v;
    end
    for k, v in pairs(jicofo_entry.urlParams or {}) do
        merged[k] = v;
    end
    return merged;
end

-- Resolves the room from the request payload's/query's conference JID.
local function find_room(conference)
    if type(conference) ~= 'string' or conference == '' then
        return nil;
    end
    local room = get_room_from_jid(room_jid_match_rewrite(conference));
    if room and is_healthcheck_room(room.jid) then
        return nil;
    end
    return room;
end

-- Returns the client-facing entry and the jicofo-only entry for an agent, or nil when unknown.
local function get_agent(room, agent_id)
    local agents = room.jitsiMetadata and room.jitsiMetadata.agents;
    if type(agent_id) ~= 'string' or not agents or agents[agent_id] == nil then
        return nil;
    end
    local voice_agents = room._data.voice_agents or {};
    return agents[agent_id], voice_agents[agent_id] or {};
end

local function agent_response(agent_id, entry)
    return {
        agentId = agent_id;
        displayName = entry.displayName;
        sourceName = entry.sourceName;
        state = entry.state;
    };
end

-- Fires the metadata rebroadcast after agent state changed.
local function notify_metadata_changed(room)
    if main_muc_module then
        main_muc_module:fire_event('room-metadata-changed', { room = room; });
    end
end

-- ── Webhooks ──────────────────────────────────────────────────────────────────

local deliver_webhook;
deliver_webhook = function(url, body, signature, attempt)
    local headers = { ['Content-Type'] = JSON_CONTENT_TYPE };
    if signature then
        headers['X-Agent-Signature'] = signature;
    end
    local ok, err = pcall(http.request, url, { method = 'POST'; headers = headers; body = body; },
        function(_, code)
            if type(code) == 'number' and code >= 200 and code < 300 then
                return;
            end
            if attempt < WEBHOOK_RETRIES then
                module:add_timer(2 ^ attempt, function()
                    deliver_webhook(url, body, signature, attempt + 1);
                end);
            else
                module:log('warn', 'Webhook to %s failed after %d attempts (last status %s)',
                    url, attempt, tostring(code));
            end
        end);
    if not ok then
        module:log('warn', 'Webhook request to %s errored: %s', url, tostring(err));
    end
end

local function send_webhook(room, agent_id, entry, callback_url, event_name, extra)
    if not callback_url then
        return;
    end
    local payload = {
        event = event_name;
        agentId = agent_id;
        conference = room.jid;
        sourceName = entry.sourceName;
        state = entry.state;
        timestamp = os.date('!%Y-%m-%dT%H:%M:%SZ');
    };
    for k, v in pairs(extra or {}) do
        payload[k] = v;
    end
    local body = json.encode(payload);
    local signature;
    if WEBHOOK_SECRET ~= '' then
        signature = 'sha256=' .. hashes.hmac_sha256(WEBHOOK_SECRET, body, true);
    end
    deliver_webhook(callback_url, body, signature, 1);
end

-- Tears an agent down: terminal state, agent.ended webhook, removal from both maps.
local function remove_agent(room, agent_id, reason)
    local entry, jicofo_entry = get_agent(room, agent_id);
    if not entry then
        return false;
    end
    entry.state = STATE_ENDED;
    send_webhook(room, agent_id, entry, jicofo_entry.callbackUrl, 'agent.ended', { reason = reason });
    room.jitsiMetadata.agents[agent_id] = nil;
    if room._data.voice_agents then
        room._data.voice_agents[agent_id] = nil;
    end
    notify_metadata_changed(room);
    return true;
end

-- ── Handlers ──────────────────────────────────────────────────────────────────

local function handle_invite(event)
    invite_count();
    local request = event.request;

    local auth_error = check_authorization(request);
    if auth_error then
        return auth_error;
    end
    local payload, parse_error = parse_json_request(request);
    if not payload then
        return parse_error;
    end

    local room = find_room(payload.conference);
    if not room then
        module:log('warn', 'No room found for %s', tostring(payload.conference));
        return error_response(404, 'Room not found');
    end

    if not is_valid_display_name(payload.displayName) then
        return error_response(400, 'Missing or invalid displayName');
    end

    -- Agent ids live in a reserved "agent-" namespace so they can NEVER equal a real participant's
    -- endpoint id (8 hex chars) -- otherwise a caller could shadow a real participant's roster entry and
    -- source. The prefix is enforced/normalized here (the authoritative id space), which makes the
    -- collision impossible by construction rather than via a racy occupant check. The suffix after the
    -- prefix is validated to a safe charset and to exclude prototype-pollution keys (defense in depth for
    -- the client, which keys plain objects by agent id).
    local agent_id;
    local requested = payload.agentId;
    if requested ~= nil then
        if type(requested) ~= 'string' then
            return error_response(400, 'Invalid agentId');
        end
        -- Accept with or without the reserved prefix; normalize to exactly one.
        local suffix = starts_with(requested, AGENT_ID_PREFIX)
            and requested:sub(#AGENT_ID_PREFIX + 1) or requested;
        if not suffix:match('^[%w_-]+$') or #suffix > 48
                or suffix == '__proto__' or suffix == 'constructor' or suffix == 'prototype' then
            return error_response(400, 'Invalid agentId');
        end
        agent_id = AGENT_ID_PREFIX .. suffix;
    else
        agent_id = AGENT_ID_PREFIX .. hashes.sha256(random.bytes(8), true):sub(1, 8);
    end

    local url_params, params_error = validate_string_map(payload.urlParams, 'urlParams');
    if params_error then
        return error_response(400, params_error);
    end
    local http_headers, headers_error = validate_string_map(payload.httpHeaders, 'httpHeaders');
    if headers_error then
        return error_response(400, headers_error);
    end
    local custom_params, custom_error = validate_string_map(payload.customParameters, 'customParameters');
    if custom_error then
        return error_response(400, custom_error);
    end
    local callback_url, callback_error = validate_callback_url(payload.callbackUrl);
    if callback_error then
        return error_response(400, callback_error);
    end
    if has_reserved_header(http_headers) then
        return error_response(400, 'httpHeaders must not set X-Agent-* headers; use endpoint');
    end
    if payload.endpoint ~= nil then
        local endpoint_headers, endpoint_error = validate_endpoint(payload.endpoint);
        if endpoint_error then
            return error_response(400, endpoint_error);
        end
        http_headers = http_headers or {};
        for k, v in pairs(endpoint_headers) do
            http_headers[k] = v;
        end
    end

    room.jitsiMetadata = room.jitsiMetadata or {};
    local agents = room.jitsiMetadata.agents or {};
    local voice_agents = room._data.voice_agents or {};
    local source_name = agent_id .. '-a0';

    local existing = agents[agent_id];
    if existing and existing.state == STATE_FAILED then
        -- A failed allocation is terminal for jicofo: re-inviting replaces the record, and the removal
        -- broadcast clears jicofo's failure before the fresh entry is announced.
        module:log('info', 'Replacing failed voice agent %s in room %s', agent_id, room.jid);
        agents[agent_id] = nil;
        voice_agents[agent_id] = nil;
        notify_metadata_changed(room);
        existing = nil;
    end
    -- Idempotent on agentId: an identical re-invite returns the existing agent; a different one conflicts.
    if existing then
        local jicofo_entry = voice_agents[agent_id] or {};
        if existing.displayName == payload.displayName
                and maps_equal(jicofo_entry.urlParams, url_params)
                and maps_equal(jicofo_entry.httpHeaders, http_headers)
                and maps_equal(jicofo_entry.customParameters, custom_params)
                and jicofo_entry.callbackUrl == callback_url then
            return { status_code = 200, body = json.encode({ agentId = agent_id, sourceName = source_name }) };
        end
        return error_response(409, 'agentId already exists with different parameters');
    end

    local count = 0;
    for _ in pairs(agents) do
        count = count + 1;
    end
    if count >= MAX_AGENTS_PER_ROOM then
        return error_response(409, 'Too many agents in the room');
    end

    -- Client-facing entry (broadcast to every occupant).
    agents[agent_id] = {
        kind = 'agent';
        displayName = payload.displayName;
        sourceName = source_name;
        state = STATE_PROVISIONING;
    };
    -- Jicofo-only connect config (merged into the admin metadata payload below).
    voice_agents[agent_id] = {
        urlParams = url_params;
        httpHeaders = http_headers;
        customParameters = custom_params;
        callbackUrl = callback_url;
    };

    room.jitsiMetadata.agents = agents;
    room._data.voice_agents = voice_agents;

    module:log('info', 'Voice agent %s invited to room %s,meeting_id:%s',
        agent_id, room.jid, room._data.meetingId);
    notify_metadata_changed(room);
    invite_success_count();

    return { status_code = 200, body = json.encode({ agentId = agent_id, sourceName = source_name }) };
end

local function handle_dismiss(event)
    dismiss_count();
    local request = event.request;

    local auth_error = check_authorization(request);
    if auth_error then
        return auth_error;
    end
    local payload, parse_error = parse_json_request(request);
    if not payload then
        return parse_error;
    end

    local room = find_room(payload.conference);
    if not room then
        return error_response(404, 'Room not found');
    end

    if not remove_agent(room, payload.agentId, 'dismissed') then
        return error_response(404, 'Agent not found');
    end

    module:log('info', 'Voice agent %s dismissed from room %s,meeting_id:%s',
        payload.agentId, room.jid, room._data.meetingId);

    return { status_code = 200, body = json.encode({ agentId = payload.agentId }) };
end

local function query_params(request)
    local query = request.url and request.url.query;
    return query and http_util.formdecode(query) or {};
end

local function handle_list(event)
    local request = event.request;

    local auth_error = check_authorization(request);
    if auth_error then
        return auth_error;
    end

    local room = find_room(query_params(request).conference);
    if not room then
        return error_response(404, 'Room not found');
    end

    local agents = (room.jitsiMetadata and room.jitsiMetadata.agents) or {};
    return { status_code = 200, body = json.encode({ agents = agents }) };
end

local function handle_get(event)
    local request = event.request;

    local auth_error = check_authorization(request);
    if auth_error then
        return auth_error;
    end

    local params = query_params(request);
    local room = find_room(params.conference);
    if not room then
        return error_response(404, 'Room not found');
    end
    local entry = get_agent(room, params.agentId);
    if not entry then
        return error_response(404, 'Agent not found');
    end
    return { status_code = 200, body = json.encode(agent_response(params.agentId, entry)) };
end

-- Internal lifecycle reporting for jicofo/JVB; drives the client-facing state and the webhooks.
local function handle_status(event)
    local request = event.request;

    local auth_error = check_status_authorization(request);
    if auth_error then
        return auth_error;
    end
    local payload, parse_error = parse_json_request(request);
    if not payload then
        return parse_error;
    end

    local room = find_room(payload.conference);
    if not room then
        return error_response(404, 'Room not found');
    end
    if not STATUS_TRANSITIONS[payload.state] then
        return error_response(400, 'Invalid state');
    end
    local reason = type(payload.reason) == 'string' and payload.reason or nil;

    if payload.state == STATE_ENDED then
        if not remove_agent(room, payload.agentId, reason or 'ended') then
            return error_response(404, 'Agent not found');
        end
        return { status_code = 200, body = json.encode({ agentId = payload.agentId }) };
    end

    local entry, jicofo_entry = get_agent(room, payload.agentId);
    if not entry then
        return error_response(404, 'Agent not found');
    end
    if STATE_RANK[payload.state] <= (STATE_RANK[entry.state] or 0) then
        module:log('debug', 'Ignoring stale status %s for agent %s in state %s',
            payload.state, payload.agentId, entry.state);
        return { status_code = 200, body = json.encode(agent_response(payload.agentId, entry)) };
    end
    entry.state = payload.state;
    if payload.state == STATE_ACTIVE then
        send_webhook(room, payload.agentId, entry, jicofo_entry.callbackUrl, 'agent.connected');
    elseif payload.state == STATE_FAILED then
        send_webhook(room, payload.agentId, entry, jicofo_entry.callbackUrl, 'agent.failed', { reason = reason });
    end
    notify_metadata_changed(room);
    return { status_code = 200, body = json.encode(agent_response(payload.agentId, entry)) };
end

module:log('info', 'Adding http handlers for /voice-agent on %s', module.host);
module:depends('http');
module:provides('http', {
    default_path = '/';
    route = {
        ['POST voice-agent/invite'] = function(event)
            return async_handler_wrapper(event, handle_invite);
        end;
        ['POST voice-agent/dismiss'] = function(event)
            return async_handler_wrapper(event, handle_dismiss);
        end;
        ['GET voice-agent/list'] = function(event)
            return async_handler_wrapper(event, handle_list);
        end;
        ['GET voice-agent/get'] = function(event)
            return async_handler_wrapper(event, handle_get);
        end;
        ['POST voice-agent/status'] = function(event)
            return async_handler_wrapper(event, handle_status);
        end;
    };
});

process_host_module(muc_component_host, function(host_module)
    -- Merge the jicofo-only connect config into the admin metadata payload: jicofo
    -- receives 'agents' entries carrying BOTH the client-facing fields and the dial
    -- urlParams/httpHeaders; regular occupants only ever get the client-facing map
    -- from room.jitsiMetadata (this hook fires inside the admin branch of
    -- mod_room_metadata_component's send_metadata only).
    host_module:hook('jitsi-room-metadata-admin-extra', function(event)
        local room = event.room;
        local agents = room.jitsiMetadata and room.jitsiMetadata.agents;
        local voice_agents = room._data.voice_agents;
        if not agents or not voice_agents or type(event.extra) ~= 'table' then
            return nil;
        end

        local merged = {};
        for agent_id, client_entry in pairs(agents) do
            local entry = table_shallow_copy(client_entry);
            local jicofo_entry = voice_agents[agent_id];
            if jicofo_entry then
                entry.urlParams = dial_url_params(jicofo_entry);
                entry.httpHeaders = jicofo_entry.httpHeaders;
            end
            merged[agent_id] = entry;
        end
        -- Contribute via the accumulator (and return nil) so other admin-extra
        -- contributors still run — a non-nil return would stop the handler chain.
        event.extra.agents = merged;
        return nil;
    end);

    -- The conference ending takes every agent with it; make that observable to the customer.
    host_module:hook('muc-room-destroyed', function(event)
        local room = event.room;
        local agents = room.jitsiMetadata and room.jitsiMetadata.agents;
        if not agents then
            return;
        end
        local voice_agents = room._data.voice_agents or {};
        for agent_id, entry in pairs(agents) do
            -- The module may be loaded on several hosts (e.g. via global modules_enabled), each hooking
            -- the same room: the first run marks the agent ended so later runs stay silent.
            if entry.state ~= STATE_ENDED then
                entry.state = STATE_ENDED;
                send_webhook(room, agent_id, entry, (voice_agents[agent_id] or {}).callbackUrl,
                    'agent.ended', { reason = 'room-destroyed' });
            end
        end
    end);
end);
