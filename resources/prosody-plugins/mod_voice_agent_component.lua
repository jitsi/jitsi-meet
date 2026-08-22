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
--   }
-- Jicofo-only (never broadcast; merged into the admin metadata payload through
-- the 'jitsi-room-metadata-admin-extra' hook):
--   room._data.voice_agents[agentId] = { urlParams = {...}, httpHeaders = {...} }
-- jicofo parses both from the same 'agents' map: it reads urlParams/httpHeaders
-- and ignores the client-facing fields; clients never see the jicofo-only ones.
--
-- ── Endpoints ─────────────────────────────────────────────────────────────────
-- Authentication: Authorization: Bearer <system ASAP token>, verified against
-- prosody_password_public_key_repo_url (NOT login tokens), exactly like
-- mod_muc_jigasi_invite.
--
--   POST /voice-agent/invite   { "conference": "<room jid>",
--                                "displayName": "<name>",
--                                "agentId": "<id>",           -- optional, generated when absent
--                                "endpoint": { "url": "wss://...",   -- optional convenience:
--                                              "authorization": "..." }, -- mapped to the
--                                                                        -- X-Agent-* headers
--                                "urlParams": { ... },        -- optional, passed to jicofo
--                                "httpHeaders": { ... } }     -- optional, passed to jicofo
--     → 200 { "agentId": "...", "sourceName": "<agentId>-a0" }
--   POST /voice-agent/dismiss  { "conference": "<room jid>", "agentId": "<id>" }
--     → 200
--   GET  /voice-agent/list?conference=<room jid>
--     → 200 { "agents": { <agentId>: { client-facing fields } } }
--
-- Copyright (C) 2026-present 8x8, Inc.

local hashes = require 'util.hashes';
local random = require 'util.random';
local json = require 'cjson.safe';
local http_util = require 'util.http';

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
local MAX_PARAM_VALUE_LENGTH = 2048;
local MAX_DISPLAY_NAME_LENGTH = 256;

-- Reserved namespace for agent ids, so an agent id can never equal a real participant's endpoint id.
local AGENT_ID_PREFIX = 'agent-';

-- The proxy-facing connect headers the optional 'endpoint' convenience object
-- maps to (see opus-transcriber-proxy resolveAgentEndpoint).
local ENDPOINT_URL_HEADER = 'X-Agent-Endpoint';
local ENDPOINT_AUTH_HEADER = 'X-Agent-Authorization';

local invite_count = module:measure('voice_agent_invite_rate', 'rate');
local invite_success_count = module:measure('voice_agent_invite_success', 'rate');
local dismiss_count = module:measure('voice_agent_dismiss_rate', 'rate');

local ASAP_KEY_SERVER = module:get_option_string('prosody_password_public_key_repo_url', '');
local token_util = module:require 'token/util'.new(module);
if ASAP_KEY_SERVER then
    token_util:set_asap_key_server(ASAP_KEY_SERVER);
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

-- Validates a string->string map (urlParams / httpHeaders); returns a bounded
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
        if #v > MAX_PARAM_VALUE_LENGTH then
            return nil, name .. ' value too long';
        end
        entries = entries + 1;
        if entries > MAX_PARAM_ENTRIES then
            return nil, name .. ' has too many entries';
        end
        copy[k] = v;
    end
    return copy;
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

-- Fires the metadata rebroadcast after agent state changed.
local function notify_metadata_changed(room)
    if main_muc_module then
        main_muc_module:fire_event('room-metadata-changed', { room = room; });
    end
end

local function handle_invite(event)
    invite_count();
    local request = event.request;

    local auth_error = check_authorization(request);
    if auth_error then
        return auth_error;
    end

    if request.headers.content_type ~= JSON_CONTENT_TYPE or (not request.body or #request.body == 0) then
        module:log('warn', 'Wrong content type: %s or missing payload', request.headers.content_type);
        return { status_code = 400 };
    end
    local payload, decode_error = json.decode(request.body);
    if not payload then
        module:log('warn', 'Cannot decode json error:%s', decode_error);
        return { status_code = 400 };
    end

    local room = find_room(payload.conference);
    if not room then
        module:log('warn', 'No room found for %s', tostring(payload.conference));
        return { status_code = 404, body = json.encode({ error = 'Room not found' }) };
    end

    if type(payload.displayName) ~= 'string' or payload.displayName == ''
            or #payload.displayName > MAX_DISPLAY_NAME_LENGTH then
        return { status_code = 400, body = json.encode({ error = 'Missing or invalid displayName' }) };
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
            return { status_code = 400, body = json.encode({ error = 'Invalid agentId' }) };
        end
        -- Accept with or without the reserved prefix; normalize to exactly one.
        local suffix = starts_with(requested, AGENT_ID_PREFIX)
            and requested:sub(#AGENT_ID_PREFIX + 1) or requested;
        if not suffix:match('^[%w_-]+$') or #suffix > 48
                or suffix == '__proto__' or suffix == 'constructor' or suffix == 'prototype' then
            return { status_code = 400, body = json.encode({ error = 'Invalid agentId' }) };
        end
        agent_id = AGENT_ID_PREFIX .. suffix;
    else
        agent_id = AGENT_ID_PREFIX .. hashes.sha256(random.bytes(8), true):sub(1, 8);
    end

    local url_params, params_error = validate_string_map(payload.urlParams, 'urlParams');
    if params_error then
        return { status_code = 400, body = json.encode({ error = params_error }) };
    end
    local http_headers, headers_error = validate_string_map(payload.httpHeaders, 'httpHeaders');
    if headers_error then
        return { status_code = 400, body = json.encode({ error = headers_error }) };
    end

    -- Convenience: map endpoint.{url,authorization} onto the proxy-facing connect headers.
    if payload.endpoint ~= nil then
        if type(payload.endpoint) ~= 'table' or type(payload.endpoint.url) ~= 'string'
                or not starts_with(payload.endpoint.url, 'wss://') then
            return { status_code = 400, body = json.encode({ error = 'endpoint.url must be a wss:// URL' }) };
        end
        http_headers = http_headers or {};
        http_headers[ENDPOINT_URL_HEADER] = payload.endpoint.url;
        if type(payload.endpoint.authorization) == 'string' then
            http_headers[ENDPOINT_AUTH_HEADER] = payload.endpoint.authorization;
        end
    end

    room.jitsiMetadata = room.jitsiMetadata or {};
    local agents = room.jitsiMetadata.agents or {};
    local voice_agents = room._data.voice_agents or {};

    if agents[agent_id] == nil then
        local count = 0;
        for _ in pairs(agents) do
            count = count + 1;
        end
        if count >= MAX_AGENTS_PER_ROOM then
            return { status_code = 409, body = json.encode({ error = 'Too many agents in the room' }) };
        end
    end

    local source_name = agent_id .. '-a0';

    -- Client-facing entry (broadcast to every occupant).
    agents[agent_id] = {
        kind = 'agent';
        displayName = payload.displayName;
        sourceName = source_name;
    };
    -- Jicofo-only connect config (merged into the admin metadata payload below).
    voice_agents[agent_id] = {
        urlParams = url_params;
        httpHeaders = http_headers;
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

    if request.headers.content_type ~= JSON_CONTENT_TYPE or (not request.body or #request.body == 0) then
        return { status_code = 400 };
    end
    local payload, decode_error = json.decode(request.body);
    if not payload then
        module:log('warn', 'Cannot decode json error:%s', decode_error);
        return { status_code = 400 };
    end

    local room = find_room(payload.conference);
    if not room then
        return { status_code = 404, body = json.encode({ error = 'Room not found' }) };
    end

    local agent_id = payload.agentId;
    local agents = room.jitsiMetadata and room.jitsiMetadata.agents;
    if type(agent_id) ~= 'string' or not agents or agents[agent_id] == nil then
        return { status_code = 404, body = json.encode({ error = 'Agent not found' }) };
    end

    agents[agent_id] = nil;
    if room._data.voice_agents then
        room._data.voice_agents[agent_id] = nil;
    end

    module:log('info', 'Voice agent %s dismissed from room %s,meeting_id:%s',
        agent_id, room.jid, room._data.meetingId);
    notify_metadata_changed(room);

    return { status_code = 200 };
end

local function handle_list(event)
    local request = event.request;

    local auth_error = check_authorization(request);
    if auth_error then
        return auth_error;
    end

    local query = request.url and request.url.query;
    local params = query and http_util.formdecode(query) or {};
    local room = find_room(params.conference);
    if not room then
        return { status_code = 404, body = json.encode({ error = 'Room not found' }) };
    end

    local agents = (room.jitsiMetadata and room.jitsiMetadata.agents) or {};
    return { status_code = 200, body = json.encode({ agents = agents }) };
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
    };
});

-- Merge the jicofo-only connect config into the admin metadata payload: jicofo
-- receives 'agents' entries carrying BOTH the client-facing fields and
-- urlParams/httpHeaders; regular occupants only ever get the client-facing map
-- from room.jitsiMetadata (this hook fires inside the admin branch of
-- mod_room_metadata_component's send_metadata only).
process_host_module(muc_component_host, function(host_module)
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
                entry.urlParams = jicofo_entry.urlParams;
                entry.httpHeaders = jicofo_entry.httpHeaders;
            end
            merged[agent_id] = entry;
        end
        -- Contribute via the accumulator (and return nil) so other admin-extra
        -- contributors still run — a non-nil return would stop the handler chain.
        event.extra.agents = merged;
        return nil;
    end);
end);
