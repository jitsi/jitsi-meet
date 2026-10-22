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
-- Prosody-only (never broadcast):
--   room._data.voice_agents[agentId] = { endpoint = { url, authorization }, customParameters, callbackUrl,
--       mediaFormat = { encoding }, fanIn }
-- The dial config stays here: jicofo's connect carries only the conference and
-- agent id, and the media relay fetches the endpoint by id (GET /voice-agent/dial)
-- when the bridge connects, so no customer secret travels through room metadata,
-- jicofo or the bridge. callbackUrl never leaves prosody.
--
-- ── Endpoints (contract frozen at v1.0 — see AGENT_REST_API.md) ───────────────
-- Authentication: Authorization: Bearer <system ASAP token>, verified against
-- prosody_password_public_key_repo_url (NOT login tokens), like mod_muc_jigasi_invite. Unlike it, the token's
-- room and sub claims scope the caller, as a meeting token's do: token/util's verify_room checks them against
-- the resolved room ('*' allows every room, a '*' sub every tenant), as mod_muc_size does for its routes, and
-- a request for another room is 403. A room claim is required; a breakout room is checked as its main room.
--
-- `conference` names the room as customers know it, '<tenant>/<room>' or '<room>' (plain or percent-encoded, any
-- case), or by its JID (what jicofo and the media relay send, and the only way to name a breakout room). Every
-- response, webhook and the dial config name it the public way, as the meeting URL spells it; never by JID.
--
--   POST /voice-agent/invite   { conference, displayName, agentId?, endpoint{url,authorization?},
--                                customParameters?, callbackUrl?, mediaFormat?{encoding}, fanIn? }
--     mediaFormat.encoding: 'audio/l16' (PCM16 24 kHz, the default) or 'audio/opus' (relayed undecoded)
--     fanIn: 'per-source' (every participant's audio as its own stream, the default) or 'dominant'
--       (only the dominant speaker's, as the bridge ranks them)
--     → 200 { agentId, sourceName }  — idempotent on agentId: an identical re-invite
--       returns the existing agent, a different one is 409; 409 too while anyone has E2EE on
--   POST /voice-agent/dismiss  { conference, agentId } → 200 { agentId }
--   GET  /voice-agent/list?conference=<room> → 200 { agents = { <agentId>: <client fields> } }
--   GET  /voice-agent/get?conference=<room>&agentId=<id> → 200 <agent> | 404
--   POST /voice-agent/status   { conference, agentId, state, reason? }
--     internal: jicofo and the media relay advance the lifecycle (connecting|active|failed|ended);
--     active → agent.connected, failed → agent.failed, ended → teardown (agent.ended unless the agent had
--     already failed: one terminal webhook per agent); forward-only, so a stale or duplicate report is
--     acknowledged and ignored; 404 once the agent is gone
--     auth: ASAP, or the voice_agent_status_secret (jicofo) / voice_agent_dial_secret (relay) shared secrets
--   GET  /voice-agent/dial?conference=<jid>&agentId=<id>
--     internal: the media relay fetches { agentId, conference, endpoint, customParameters, mediaFormat, fanIn }
--     when dialing;
--     auth: ASAP or voice_agent_dial_secret (falls back to voice_agent_status_secret when no dial secret is
--     set, which lets whoever holds jicofo's secret read customer credentials; set both in production)
--   GET  /voice-agent/events[?conference=<room>]
--     a text/event-stream of the lifecycle events below, for a backend that holds one outbound connection instead
--     of exposing a webhook: `id: <id>` / `event: agent.connected|agent.failed|agent.ended` / `data: <payload>`.
--     A new stream first gets `snapshot` ({ conference?, agents: [ { agentId, conference, displayName, sourceName,
--     state } ] }), unless its Last-Event-ID is still in the replay buffer, in which case it gets the events it
--     missed instead. A keepalive comment every 15 s; closed after voice_agent_event_stream_max_age seconds
--     (the client reconnects with Last-Event-ID); at most voice_agent_max_event_streams open at once (503)
--     auth: ASAP, like the provisioning routes; a named room that exists is checked like them, and a stream
--     carries only the events of rooms the token may act on (verify_room per room). A replayed event of a room
--     that is gone uses what verify_room answered for the same token while the room existed, and is skipped
--     when that token was never checked against it
--
-- Provisioning auth needs prosody_password_public_key_repo_url: without it the module refuses to load (a meeting
-- token would otherwise pass), unless voice_agent_insecure_skip_auth is set for a dev rig. It also needs
-- muc_mapper_domain_base, which verify_room resolves rooms with, as the token modules do. Lifecycle webhooks need
-- voice_agent_webhook_secret: without it an invite with a callbackUrl is refused rather than delivered unsigned.
-- voice_agent_callback_allowed_hosts (exact host or .suffix) limits where callbacks may go; empty allows any host,
-- so an OSS deployment that accepts invites from several customers should set it (prosody POSTs there).
--
-- Webhooks: when an agent has a callbackUrl, lifecycle events are POSTed to it as
-- { event, agentId, conference, sourceName, state, timestamp, reason? }, signed
-- X-Agent-Signature: sha256=<hmac> with voice_agent_webhook_secret, retried with
-- backoff up to voice_agent_webhook_retries times (at-least-once).
-- Every lifecycle event is also written to the open event streams (GET /voice-agent/events) and fires the module
-- event 'voice-agent-lifecycle' on this host, with { room, agent_id, payload } and the same payload, whether or
-- not the agent has a callbackUrl, so a co-located module can deliver it another way (a hosted deployment's
-- webhook platform).
--
-- Copyright (C) 2026-present 8x8, Inc.

local async = require 'util.async';
local cache_new = require 'util.cache'.new;
local hashes = require 'util.hashes';
local random = require 'util.random';
local json = require 'cjson.safe';
local http_util = require 'util.http';
local http = require 'net.http';

local util = module:require 'util';
local async_handler_wrapper = util.async_handler_wrapper;
local extract_subdomain = util.extract_subdomain;
local get_room_by_name_and_subdomain = util.get_room_by_name_and_subdomain;
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
-- Optional: breakout rooms can be addressed by JID too, and host agents like the main room.
local breakout_rooms_component_host = module:get_option_string('breakout_rooms_component');

-- Where lifecycle webhooks may be delivered (exact host or '.suffix'); empty allows any host.
local CALLBACK_ALLOWED_HOSTS = module:get_option_array('voice_agent_callback_allowed_hosts', {});

local JSON_CONTENT_TYPE = 'application/json';

-- Caps keeping a single provisioning request from bloating room state and the
-- metadata broadcastable payload.
local MAX_AGENTS_PER_ROOM = module:get_option_number('voice_agent_max_agents', 5);
-- Event streams (GET /voice-agent/events): how many may be open at once (503 beyond), and the age at which one is
-- closed so its client reconnects with Last-Event-ID, which also bounds how long an expired token keeps one open.
local MAX_EVENT_STREAMS = module:get_option_number('voice_agent_max_event_streams', 64);
local EVENT_STREAM_MAX_AGE = module:get_option_number('voice_agent_event_stream_max_age', 3600);
local MAX_PARAM_ENTRIES = 16;
local MAX_PARAM_KEY_LENGTH = 128;
local MAX_PARAM_VALUE_LENGTH = 2048;
local MAX_DISPLAY_NAME_LENGTH = 256;
local MAX_CALLBACK_URL_LENGTH = 2048;

-- Reserved namespace for agent ids, so an agent id can never equal a real participant's endpoint id.
local AGENT_ID_PREFIX = 'agent-';

-- Lifecycle states; 'ended' is terminal and removes the agent.
local STATE_PROVISIONING = 'provisioning';
local STATE_CONNECTING = 'connecting';
local STATE_ACTIVE = 'active';
local STATE_FAILED = 'failed';
local STATE_ENDED = 'ended';
-- Forward-only lifecycle: a report only ever moves the state forward, so a duplicate or a stale retry
-- (a delayed 'connecting' landing after 'active') is acknowledged and ignored. 'ended' outranks 'failed' so a
-- failed agent is still removed (and stops counting toward the room cap); it gets no second terminal webhook.
local STATE_RANK = {
    [STATE_PROVISIONING] = 0; [STATE_CONNECTING] = 1; [STATE_ACTIVE] = 2; [STATE_FAILED] = 3; [STATE_ENDED] = 4;
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
    module:log('warn', 'voice_agent_webhook_secret is not set: invites with a callbackUrl will be refused, since '
        .. 'the webhook contract promises signed deliveries');
end

-- Shared secret jicofo presents on /voice-agent/status (it cannot mint ASAP tokens); ASAP is still accepted.
local STATUS_SECRET = module:get_option_string('voice_agent_status_secret', '');
-- Shared secret the media relay presents on /voice-agent/dial (and /status); separate from jicofo's so that
-- holding jicofo's secret does not read customer credentials. Falls back to the status secret when unset.
local DIAL_SECRET = module:get_option_string('voice_agent_dial_secret', '');
if DIAL_SECRET == '' and STATUS_SECRET ~= '' then
    module:log('warn', 'voice_agent_dial_secret is not set: the status secret also reads dial configs (customer '
        .. 'endpoint credentials); set both to keep jicofo and the media relay apart');
end

local ASAP_KEY_SERVER = module:get_option_string('prosody_password_public_key_repo_url', '');
local token_util;
if INSECURE_SKIP_AUTH then
    module:log('warn', 'voice_agent_insecure_skip_auth is ON — /voice-agent endpoints are UNAUTHENTICATED');
else
    -- Empty string is truthy in Lua, so compare explicitly.
    if ASAP_KEY_SERVER == '' then
        -- token/util would fall back to the host's meeting-token settings, and a meeting token must not invite
        -- or dismiss agents, nor read dial configs. Same stance as mod_muc_jigasi_invite.
        module:log('error', 'No prosody_password_public_key_repo_url set: provisioning tokens cannot be verified. '
            .. 'Disabling /voice-agent (set voice_agent_insecure_skip_auth only on a dev rig).');
        return;
    end
    token_util = module:require 'token/util'.new(module);
    token_util:set_asap_key_server(ASAP_KEY_SERVER);
    -- Required here whatever asap_require_room_claim says: verify_room needs a room claim to check the tenant.
    token_util:set_asap_require_room_claim(true);
    local muc_domain_base = module:get_option_string('muc_mapper_domain_base');
    if muc_domain_base == nil or muc_domain_base == '' then
        -- verify_room resolves rooms under this domain; without it every room check would be refused.
        module:log('error', 'No muc_mapper_domain_base set: token room claims cannot be verified. '
            .. 'Disabling /voice-agent.');
        return;
    end
end

local main_muc_module;

process_host_module(muc_component_host, function(host_module)
    main_muc_module = host_module;
end);

-- Verifies a token; returns the session token/util filled with its claims (room, sub), or nil.
local function verified_session(token)
    local session = {};
    session.auth_token = token;
    local verified, reason, msg = token_util:process_and_verify_token(session);
    if not verified then
        module:log('warn', 'not a valid token %s %s', tostring(reason), tostring(msg));
        return nil;
    end
    return session;
end

-- Verifies the Authorization header; returns nil and the token's session when authorized (no session for a dev
-- rig without auth), or the error response.
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
    local session = verified_session(token);
    if not session then
        return { status_code = 401 };
    end
    return nil, session;
end

-- Constant-time secret comparison: HMACs under a per-load random key have a fixed length and leak nothing about
-- where a mismatch occurs, unlike a plain string compare.
local COMPARE_KEY = random.bytes(16);
local function secrets_equal(a, b)
    return hashes.hmac_sha256(COMPARE_KEY, a, true) == hashes.hmac_sha256(COMPARE_KEY, b, true);
end

-- Whether the request carries one of the given shared secrets as a bearer.
local function bearer_matches(request, ...)
    local token = request.headers['authorization'];
    if type(token) ~= 'string' or not starts_with(token, 'Bearer ') then
        return false;
    end
    for _, secret in ipairs({ ... }) do
        if secret ~= '' and secrets_equal(token:sub(8), secret) then
            return true;
        end
    end
    return false;
end

-- The status route is called by jicofo and the media relay, neither of which mints ASAP tokens: accept either
-- shared secret as a bearer there, in addition to a regular ASAP token. Never used for the provisioning routes.
local function check_status_authorization(request)
    if bearer_matches(request, STATUS_SECRET, DIAL_SECRET) then
        return nil;
    end
    return check_authorization(request);
end

-- The dial route hands out customer credentials: only the media relay's secret (or the status secret while no
-- dial secret is configured) and ASAP are accepted; jicofo's secret alone does not read them once both are set.
local function check_dial_authorization(request)
    if bearer_matches(request, DIAL_SECRET ~= '' and DIAL_SECRET or STATUS_SECRET) then
        return nil;
    end
    return check_authorization(request);
end

local function error_response(status_code, message)
    return { status_code = status_code, body = json.encode({ error = message }) };
end

-- A breakout room's claims are its main room's, the meeting a token names; found the way mod_speakerstats_component
-- finds it, and cached on the room object rather than in _data, which room:save() serializes.
local function claims_room(room)
    if room.jid:match('@([^/]+)') ~= breakout_rooms_component_host then
        return room;
    end
    if room.main_room then
        return room.main_room;
    end
    local host = prosody.hosts[muc_component_host];
    local muc = host and host.modules.muc;
    if muc then
        for main_room in muc.each_room() do
            if main_room._data.breakout_rooms_active and (main_room._data.breakout_rooms or {})[room.jid] then
                room.main_room = main_room;
                return main_room;
            end
        end
    end
    return nil;
end

-- token/util's verify_room on the room's claims room, as mod_muc_size does for its routes: '*' allows every room, a
-- '*' sub every tenant. Returns allowed and verify_room's reason; 'room-does-not-exist' means it cannot be decided.
local function verify_token_room(session, room)
    local target = claims_room(room);
    if not target then
        return false, 'room-does-not-exist';
    end
    -- verify_room checks a token's context.tenant against the tenant mod_jitsi_session takes from the meeting URL.
    local tenant = extract_subdomain(target.jid:match('^([^@]+)@') or '');
    session.jitsi_web_query_prefix = tenant and tenant:lower() or '';
    return token_util:verify_room(session, target.jid);
end

-- Checks the token's claims against the room. Shared-secret callers (jicofo, the media relay) and a dev rig without
-- auth have no session and are not scoped. Returns nil when allowed, or the error response.
local function check_room_authorization(session, room)
    if session == nil then
        return nil;
    end
    local allowed, reason = verify_token_room(session, room);
    if not allowed then
        -- verify_room answers a bare false when the claims do not name this room, with no reason to show.
        module:log('warn', 'Token not authorized for room %s%s: token room %s, sub %s', room.jid,
            reason and (' (' .. reason .. ')') or '', tostring(session.jitsi_meet_room),
            tostring(session.jitsi_meet_domain));
        return error_response(403, 'Token not authorized for this room');
    end
    return nil;
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

-- Validates a string->string map (customParameters); returns a bounded
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
        -- Reject control chars (CR/LF) so a value can never split or inject a header or a log line.
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

-- Broadcast to every client, so no control characters either.
local function is_valid_display_name(name)
    return type(name) == 'string' and name ~= '' and #name <= MAX_DISPLAY_NAME_LENGTH and not name:find('[%c]');
end

-- The host of an http(s) URL, lower-cased, or nil.
local function url_host(url)
    local host = url:match('^https?://([^/?#]+)');
    if not host then
        return nil;
    end
    -- Drop credentials and the port.
    host = host:gsub('^.*@', ''):gsub(':%d+$', '');
    return host:lower();
end

-- Whether callbacks may be delivered to this host: any host when no allowlist is configured, else an exact
-- entry or a subdomain of a '.suffix' entry.
local function callback_host_allowed(host)
    if #CALLBACK_ALLOWED_HOSTS == 0 then
        return true;
    end
    for _, entry in ipairs(CALLBACK_ALLOWED_HOSTS) do
        local bare = entry:lower():gsub('^%.', '');
        if host == bare or host:sub(-#bare - 1) == '.' .. bare then
            return true;
        end
    end
    return false;
end

-- Validates callbackUrl: https:// (http:// only with the dev flag), bounded, no control chars, a host the
-- deployment allows, and only while deliveries can be signed.
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
    local host = url_host(url);
    if not host or not callback_host_allowed(host) then
        return nil, 'callbackUrl host is not allowed';
    end
    if WEBHOOK_SECRET == '' then
        return nil, 'callbackUrl requires voice_agent_webhook_secret to be configured';
    end
    return url;
end

-- Validates the required endpoint.{url,authorization}; returns a bounded copy, or nil plus an error.
-- Enforces the wss:// scheme only; host-level SSRF filtering is done by the media relay's endpoint
-- guard at dial time.
local function validate_endpoint(endpoint)
    if type(endpoint) ~= 'table' or type(endpoint.url) ~= 'string' or #endpoint.url > MAX_PARAM_VALUE_LENGTH
            or endpoint.url:find('[%c]')
            or not (starts_with(endpoint.url, 'wss://')
                or (INSECURE_ALLOW_WS_ENDPOINT and starts_with(endpoint.url, 'ws://'))) then
        return nil, 'endpoint.url is required and must be a wss:// URL';
    end
    local authorization = endpoint.authorization;
    if authorization ~= nil and (type(authorization) ~= 'string' or #authorization > MAX_PARAM_VALUE_LENGTH
            or authorization:find('[%c]')) then
        return nil, 'Invalid endpoint.authorization';
    end
    return { url = endpoint.url; authorization = authorization };
end

-- Presence property a participant's client sets while it has end-to-end encryption on.
local E2EE_PRESENCE_PROPERTY = 'jitsi_participant_e2ee.enabled';

-- Whether anyone in the room has end-to-end encryption on: the agent's media goes through the bridge, which cannot
-- decrypt it.
local function is_e2ee_enabled(room)
    for _, occupant in room:each_occupant() do
        local presence = occupant:get_presence();
        if presence and presence:get_child_text(E2EE_PRESENCE_PROPERTY) == 'true' then
            return true;
        end
    end
    return false;
end

-- Audio encodings the media relay speaks on the agent leg.
local DEFAULT_MEDIA_ENCODING = 'audio/l16';
local MEDIA_ENCODINGS = { ['audio/l16'] = true; ['audio/opus'] = true };

-- Validates the optional mediaFormat; returns { encoding } (the default when absent), or nil plus an error.
local function validate_media_format(media_format)
    if media_format == nil then
        return { encoding = DEFAULT_MEDIA_ENCODING };
    end
    if type(media_format) ~= 'table' or not MEDIA_ENCODINGS[media_format.encoding] then
        return nil, 'mediaFormat.encoding must be audio/l16 or audio/opus';
    end
    for key in pairs(media_format) do
        if key ~= 'encoding' then
            return nil, 'mediaFormat supports only encoding';
        end
    end
    return { encoding = media_format.encoding };
end

-- How the media relay fans several participants' audio in to the agent.
local DEFAULT_FAN_IN = 'per-source';
local FAN_INS = { ['per-source'] = true; ['dominant'] = true };

-- Validates the optional fanIn; returns the policy (the default when absent), or nil plus an error.
local function validate_fan_in(fan_in)
    if fan_in == nil then
        return DEFAULT_FAN_IN;
    end
    if not FAN_INS[fan_in] then
        return nil, 'fanIn must be per-source or dominant';
    end
    return fan_in;
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

local MAX_CONFERENCE_LENGTH = 512;

local function url_decode(s)
    return (s:gsub('%%(%x%x)', function(hex) return string.char(tonumber(hex, 16)); end));
end

-- One segment of a room name as the client stores it (getBackendSafeRoomName): lower-cased, then percent-encoded
-- like encodeURIComponent with lower-case hex. Decoding first lets the plain and the encoded spelling meet.
local function backend_safe(segment)
    return (url_decode(segment):lower():gsub("[^%w%-_%.!~%*'%(%)]", function(c)
        return string.format('%%%02x', c:byte());
    end));
end

-- A room by the name customers know it by: '<tenant>/<room>' or '<room>', plain or percent-encoded, any case.
local function find_room_by_name(conference)
    local tenant, name = conference:match('^([^/]+)/([^/]+)$');
    if not tenant then
        if conference:find('/', 1, true) then
            return nil;
        end
        name = conference;
    end
    return get_room_by_name_and_subdomain(backend_safe(name), tenant and backend_safe(tenant));
end

-- A room by its JID: what jicofo and the media relay send, and the only way to name a breakout room. Conference and
-- breakout rooms only; a lobby room never hosts an agent, and its public name would be the main room's.
local function find_room_by_jid(conference)
    local room_jid = room_jid_match_rewrite(conference);
    local host = room_jid:match('@([^/]+)');
    if host == nil or (host ~= muc_component_host and host ~= breakout_rooms_component_host) then
        return nil;
    end
    return get_room_from_jid(room_jid);
end

-- Resolves the room from a request's conference: its public name or its JID.
local function find_room(conference)
    if type(conference) ~= 'string' or conference == '' or #conference > MAX_CONFERENCE_LENGTH then
        return nil;
    end
    local room;
    if conference:find('@', 1, true) then
        room = find_room_by_jid(conference);
    else
        room = find_room_by_name(conference);
    end
    if room and is_healthcheck_room(room.jid) then
        return nil;
    end
    return room;
end

local MAX_REASON_LENGTH = 200;

-- A status reason as customers (agent.failed webhook) may see it: bounded, and with any internal address, such as a
-- bridge JID inside a jicofo allocation error, masked.
local function public_reason(reason)
    return (reason:sub(1, MAX_REASON_LENGTH):gsub('[%c]', ' '):gsub('%S*@%S*', '<internal>'));
end

-- The name customers know a room by: '<tenant>/<room>', or '<room>' outside a tenant. Never the MUC JID.
local function public_room_name(room)
    local tenant, name = extract_subdomain(room.jid:match('^([^@]+)@') or room.jid);
    return tenant and (tenant .. '/' .. name) or name;
end

-- Returns the client-facing entry and the jicofo-only entry for an agent, or nil when unknown.
-- The id as stored: invite accepts it with or without the reserved prefix, so the other routes do too.
local function normalize_agent_id(agent_id)
    if type(agent_id) ~= 'string' then
        return nil;
    end
    return starts_with(agent_id, AGENT_ID_PREFIX) and agent_id or (AGENT_ID_PREFIX .. agent_id);
end

-- The client-facing entry and the prosody-only record of an agent, plus its normalized id; nil when unknown.
local function get_agent(room, agent_id)
    agent_id = normalize_agent_id(agent_id);
    local agents = room.jitsiMetadata and room.jitsiMetadata.agents;
    if agent_id == nil or not agents or agents[agent_id] == nil then
        return nil;
    end
    local voice_agents = room._data.voice_agents or {};
    return agents[agent_id], voice_agents[agent_id] or {}, agent_id;
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

-- ── Event stream ──────────────────────────────────────────────────────────────

-- Stream state is shared across every host this module is loaded on (module:shared): a room's destroy hook runs in
-- whichever instance hooked the MUC host first, while the streams were opened over HTTP on another host's
-- instance, so a per-instance table would leave those streams without the room-destroyed events.
local shared = module:shared('/*/voice_agent_component/event_stream');
-- Rooms that currently have agents, for a stream's snapshot. Weak keys: a destroyed room is forgotten.
shared.rooms = shared.rooms or setmetatable({}, { __mode = 'k' });
-- Open streams: { response, conference = <public name, or nil for every room>, opened } → true.
shared.streams = shared.streams or {};
shared.count = shared.count or 0;
-- Event ids are '<epoch>-<n>'. The epoch changes with every restart, so an id from before never replays another
-- process's events; clients treat the id as opaque.
shared.epoch = shared.epoch or (random.bytes(4):gsub('.', function(c) return string.format('%02x', c:byte()); end));
shared.seq = shared.seq or 0;
-- The last EVENT_BUFFER_SIZE events as { seq, conference, room_jid, frame }, replayed to a reconnecting stream. The
-- room is kept by JID, not by object, so the buffer never holds a destroyed room alive.
shared.buffer = shared.buffer or {};
-- What verify_room answered for a token and a room ('<token hash> <room jid>' → boolean), kept after the room is
-- gone so a replay can still use it.
shared.decisions = shared.decisions or cache_new(4096);
local rooms_with_agents = shared.rooms;
local streams = shared.streams;
local event_buffer = shared.buffer;
local decisions = shared.decisions;
local EVENT_BUFFER_SIZE = 256;
local EVENT_STREAM_KEEPALIVE = 15;
-- Whether this instance owns the one keepalive timer (released on unload, see module.unload).
local keepalive_here = false;

local function event_id(seq)
    return shared.epoch .. '-' .. seq;
end

local function sse_frame(id, event_name, data)
    return 'id: ' .. id .. '\nevent: ' .. event_name .. '\ndata: ' .. data .. '\n\n';
end

-- One chunk of a chunked response; a stream never has a Content-Length.
local function chunked(data)
    return string.format('%x\r\n%s\r\n', #data, data);
end

local function close_stream(stream, why)
    if stream.closed then
        return;
    end
    stream.closed = true;
    streams[stream] = nil;
    shared.count = shared.count - 1;
    local response = stream.response;
    response.on_destroy = nil;
    if not response.finished then
        pcall(function()
            response.conn:write('0\r\n\r\n');
            response:done();
        end);
    end
    module:log('debug', 'Event stream closed (%s), %d open', why, shared.count);
end

local function stream_write(stream, data)
    if stream.closed then
        return;
    end
    local ok, err = pcall(function() stream.response.conn:write(chunked(data)); end);
    if not ok then
        module:log('debug', 'Event stream write failed: %s', tostring(err));
        close_stream(stream, 'write failed');
    end
end

local function in_scope(stream, conference)
    return stream.conference == nil or stream.conference == conference;
end

-- Whether a stream may carry a room's events: always without a token session (a dev rig without auth), otherwise
-- when verify_room accepts the token for the room; cached per room. nil when it cannot be decided (the room is gone).
local function stream_allows(stream, room)
    if stream.session == nil then
        return true;
    end
    local cached = stream.allowed[room];
    if cached ~= nil then
        return cached;
    end
    local allowed, reason = verify_token_room(stream.session, room);
    if not allowed and reason == 'room-does-not-exist' then
        return nil;
    end
    allowed = allowed and true or false;
    stream.allowed[room] = allowed;
    decisions:set(stream.token_key .. ' ' .. room.jid, allowed);
    return allowed;
end

-- Records a lifecycle event (body: its encoded payload) and writes it to every stream in scope.
local function broadcast_lifecycle(event_name, room, conference, body)
    shared.seq = shared.seq + 1;
    local seq = shared.seq;
    local frame = sse_frame(event_id(seq), event_name, body);
    table.insert(event_buffer, { seq = seq; conference = conference; room_jid = room.jid; frame = frame; });
    if #event_buffer > EVENT_BUFFER_SIZE then
        table.remove(event_buffer, 1);
    end
    for stream in pairs(streams) do
        if in_scope(stream, conference) and stream_allows(stream, room) then
            stream_write(stream, frame);
        end
    end
end

-- The frames a stream missed since its Last-Event-ID, or nil when they cannot be known (another epoch, an id
-- older than the buffer), in which case the stream gets a snapshot instead.
local function missed_frames(last_event_id, stream)
    local epoch, seq = tostring(last_event_id or ''):match('^(%x+)%-(%d+)$');
    seq = tonumber(seq);
    if epoch ~= shared.epoch or not seq or seq > shared.seq then
        return nil;
    end
    local oldest = event_buffer[1] and event_buffer[1].seq or (shared.seq + 1);
    if seq < oldest - 1 then
        return nil;
    end
    local frames = {};
    for _, entry in ipairs(event_buffer) do
        if entry.seq > seq and in_scope(stream, entry.conference) then
            local allowed = stream.session == nil;
            if not allowed then
                local room = get_room_from_jid(entry.room_jid);
                allowed = room and stream_allows(stream, room);
                if allowed == nil then
                    -- The room is gone: what verify_room answered for this token while it existed, if it was asked.
                    -- A room this token was never checked against is one it never knew, so it is skipped.
                    allowed = decisions:get(stream.token_key .. ' ' .. entry.room_jid);
                end
            end
            if allowed then
                table.insert(frames, entry.frame);
            end
        end
    end
    return frames;
end

-- Every agent in scope with its state, for a stream's first event; sorted so the output is stable.
local function snapshot_agents(stream)
    local agents = {};
    for room in pairs(rooms_with_agents) do
        local name = public_room_name(room);
        if in_scope(stream, name) and stream_allows(stream, room) then
            for agent_id, entry in pairs((room.jitsiMetadata and room.jitsiMetadata.agents) or {}) do
                local agent = agent_response(agent_id, entry);
                agent.conference = name;
                table.insert(agents, agent);
            end
        end
    end
    table.sort(agents, function(a, b)
        if a.conference ~= b.conference then
            return a.conference < b.conference;
        end
        return a.agentId < b.agentId;
    end);
    return agents;
end

-- The snapshot body, assembled by hand: cjson encodes an empty Lua table as {}, and the contract says `agents` is
-- an array even when nobody is in scope.
local function encode_snapshot(conference, agents)
    local parts = {};
    for _, agent in ipairs(agents) do
        table.insert(parts, json.encode(agent));
    end
    return '{' .. (conference and ('"conference":' .. json.encode(conference) .. ',') or '')
        .. '"agents":[' .. table.concat(parts, ',') .. ']}';
end

-- A comment line keeps proxies from closing an idle stream; the same tick retires streams past their max age.
local function arm_keepalive()
    if shared.keepalive_armed then
        return;
    end
    shared.keepalive_armed = true;
    keepalive_here = true;
    module:add_timer(EVENT_STREAM_KEEPALIVE, function()
        if next(streams) == nil then
            shared.keepalive_armed = false;
            keepalive_here = false;
            return;
        end
        local now = os.time();
        for stream in pairs(streams) do
            if now - stream.opened >= EVENT_STREAM_MAX_AGE then
                close_stream(stream, 'max age');
            else
                stream_write(stream, ': keepalive\n\n');
            end
        end
        return EVENT_STREAM_KEEPALIVE;
    end);
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
                -- The host only: the URL's query string may carry the customer's token.
                module:log('warn', 'Webhook to %s failed after %d attempts (last status %s)',
                    tostring(url_host(url)), attempt, tostring(code));
            end
        end);
    if not ok then
        module:log('warn', 'Webhook request to %s errored: %s', tostring(url_host(url)), tostring(err));
    end
end

local function send_webhook(callback_url, body)
    if not callback_url then
        return;
    end
    local signature;
    if WEBHOOK_SECRET ~= '' then
        signature = 'sha256=' .. hashes.hmac_sha256(WEBHOOK_SECRET, body, true);
    end
    deliver_webhook(callback_url, body, signature, 1);
end

local LIFECYCLE_EVENT = 'voice-agent-lifecycle';

-- One lifecycle event, three consumers: the agent's callbackUrl when it has one, the open event streams, and a
-- module event any co-located module may hook to deliver it another way. The body is encoded before the hooks
-- run, so they cannot alter it, and a failing hook cannot break the transition.
local function notify_lifecycle(room, agent_id, entry, callback_url, event_name, extra)
    local payload = {
        event = event_name;
        agentId = agent_id;
        conference = public_room_name(room);
        sourceName = entry.sourceName;
        state = entry.state;
        timestamp = os.date('!%Y-%m-%dT%H:%M:%SZ');
    };
    for k, v in pairs(extra or {}) do
        payload[k] = v;
    end
    local body = json.encode(payload);
    send_webhook(callback_url, body);
    broadcast_lifecycle(event_name, room, payload.conference, body);
    local ok, err = pcall(module.fire_event, module, LIFECYCLE_EVENT,
        { room = room; agent_id = agent_id; payload = payload; });
    if not ok then
        module:log('warn', 'A %s hook failed: %s', LIFECYCLE_EVENT, tostring(err));
    end
end

-- Tears an agent down: terminal state, agent.ended webhook (unless agent.failed already was its terminal
-- webhook), removal from both maps.
local function remove_agent(room, agent_id, reason)
    local entry, jicofo_entry, id = get_agent(room, agent_id);
    if not entry then
        return false;
    end
    agent_id = id;
    local already_terminal = entry.state == STATE_FAILED;
    entry.state = STATE_ENDED;
    if not already_terminal then
        notify_lifecycle(room, agent_id, entry, jicofo_entry.callbackUrl, 'agent.ended', { reason = reason });
    end
    room.jitsiMetadata.agents[agent_id] = nil;
    if room._data.voice_agents then
        room._data.voice_agents[agent_id] = nil;
    end
    if next(room.jitsiMetadata.agents) == nil then
        rooms_with_agents[room] = nil;
    end
    notify_metadata_changed(room);
    return true;
end

-- ── Handlers ──────────────────────────────────────────────────────────────────

local function handle_invite(event)
    invite_count();
    local request = event.request;

    local auth_error, session = check_authorization(request);
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
    local room_error = check_room_authorization(session, room);
    if room_error then
        return room_error;
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

    local endpoint, endpoint_error = validate_endpoint(payload.endpoint);
    if endpoint_error then
        return error_response(400, endpoint_error);
    end
    local custom_params, custom_error = validate_string_map(payload.customParameters, 'customParameters');
    if custom_error then
        return error_response(400, custom_error);
    end
    local callback_url, callback_error = validate_callback_url(payload.callbackUrl);
    if callback_error then
        return error_response(400, callback_error);
    end
    local media_format, media_format_error = validate_media_format(payload.mediaFormat);
    if media_format_error then
        return error_response(400, media_format_error);
    end
    local fan_in, fan_in_error = validate_fan_in(payload.fanIn);
    if fan_in_error then
        return error_response(400, fan_in_error);
    end
    room.jitsiMetadata = room.jitsiMetadata or {};
    local agents = room.jitsiMetadata.agents or {};
    local voice_agents = room._data.voice_agents or {};
    local source_name = agent_id .. '-a0';

    local existing = agents[agent_id];
    -- Idempotent on agentId: an identical re-invite returns the existing agent, even under E2EE (a retry after a
    -- timeout must not see a failure for a live agent); a different one conflicts. A failed agent is replaced below.
    if existing and existing.state ~= STATE_FAILED then
        local jicofo_entry = voice_agents[agent_id] or {};
        if existing.displayName == payload.displayName
                and maps_equal(jicofo_entry.endpoint, endpoint)
                and maps_equal(jicofo_entry.customParameters, custom_params)
                and (jicofo_entry.mediaFormat or { encoding = DEFAULT_MEDIA_ENCODING }).encoding == media_format.encoding
                and (jicofo_entry.fanIn or DEFAULT_FAN_IN) == fan_in
                and jicofo_entry.callbackUrl == callback_url then
            return { status_code = 200, body = json.encode({ agentId = agent_id, sourceName = source_name }) };
        end
        return error_response(409, 'agentId already exists with different parameters');
    end

    -- Before the failed record is replaced, so a refused invite leaves it as it was.
    if is_e2ee_enabled(room) then
        return error_response(409, 'End-to-end encryption is on in this meeting');
    end

    if existing then
        -- A failed allocation is terminal for jicofo: re-inviting replaces the record, and the removal
        -- broadcast clears jicofo's failure before the fresh entry is announced.
        module:log('info', 'Replacing failed voice agent %s in room %s', agent_id, room.jid);
        agents[agent_id] = nil;
        voice_agents[agent_id] = nil;
        notify_metadata_changed(room);
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
    -- Dial config, fetched by the media relay by id; never broadcast.
    voice_agents[agent_id] = {
        endpoint = endpoint;
        customParameters = custom_params;
        callbackUrl = callback_url;
        mediaFormat = media_format;
        fanIn = fan_in;
    };

    room.jitsiMetadata.agents = agents;
    room._data.voice_agents = voice_agents;
    rooms_with_agents[room] = true;

    module:log('info', 'Voice agent %s invited to room %s,meeting_id:%s',
        agent_id, room.jid, room._data.meetingId);
    notify_metadata_changed(room);
    invite_success_count();

    return { status_code = 200, body = json.encode({ agentId = agent_id, sourceName = source_name }) };
end

local function handle_dismiss(event)
    dismiss_count();
    local request = event.request;

    local auth_error, session = check_authorization(request);
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
    local room_error = check_room_authorization(session, room);
    if room_error then
        return room_error;
    end

    local agent_id = normalize_agent_id(payload.agentId);
    if not agent_id or not remove_agent(room, agent_id, 'dismissed') then
        return error_response(404, 'Agent not found');
    end

    module:log('info', 'Voice agent %s dismissed from room %s,meeting_id:%s',
        agent_id, room.jid, room._data.meetingId);

    return { status_code = 200, body = json.encode({ agentId = agent_id }) };
end

local function query_params(request)
    local query = request.url and request.url.query;
    return query and http_util.formdecode(query) or {};
end

local function handle_list(event)
    local request = event.request;

    local auth_error, session = check_authorization(request);
    if auth_error then
        return auth_error;
    end

    local room = find_room(query_params(request).conference);
    if not room then
        return error_response(404, 'Room not found');
    end
    local room_error = check_room_authorization(session, room);
    if room_error then
        return room_error;
    end

    local agents = (room.jitsiMetadata and room.jitsiMetadata.agents) or {};
    return { status_code = 200, body = json.encode({ agents = agents }) };
end

local function handle_get(event)
    local request = event.request;

    local auth_error, session = check_authorization(request);
    if auth_error then
        return auth_error;
    end

    local params = query_params(request);
    local room = find_room(params.conference);
    if not room then
        return error_response(404, 'Room not found');
    end
    local room_error = check_room_authorization(session, room);
    if room_error then
        return room_error;
    end
    local entry, _, agent_id = get_agent(room, params.agentId);
    if not entry then
        return error_response(404, 'Agent not found');
    end
    return { status_code = 200, body = json.encode(agent_response(agent_id, entry)) };
end


-- The public name a stream filters on. The room may not exist yet (a stream is often opened before the meeting
-- starts), so a name that resolves to no room is normalised the way public_room_name() will spell it. A JID must
-- resolve: one for a room that does not exist names nothing a customer could be told about.
local function stream_conference(conference)
    if type(conference) ~= 'string' or conference == '' or #conference > MAX_CONFERENCE_LENGTH then
        return nil;
    end
    local room = find_room(conference);
    if room then
        return public_room_name(room), room;
    end
    if conference:find('@', 1, true) then
        return nil;
    end
    local tenant, name = conference:match('^([^/]+)/([^/]+)$');
    if tenant then
        return backend_safe(tenant) .. '/' .. backend_safe(name);
    end
    if conference:find('/', 1, true) then
        return nil;
    end
    return backend_safe(conference);
end

-- Opens a lifecycle event stream on the response once the request is authorized; returns an error response instead
-- when it cannot be opened.
local function open_event_stream(request, response, session)
    local params = query_params(request);
    local conference, room;
    if params.conference ~= nil then
        conference, room = stream_conference(params.conference);
        if not conference then
            return error_response(404, 'Room not found');
        end
    end
    -- A named room that exists answers like the routes; any other stream carries only the rooms the token may act on.
    if room then
        local room_error = check_room_authorization(session, room);
        if room_error then
            return room_error;
        end
    end
    if shared.count >= MAX_EVENT_STREAMS then
        return error_response(503, 'Too many event streams');
    end

    response.status_code = 200;
    response.headers.content_type = 'text/event-stream';
    response.headers.cache_control = 'no-cache';
    response.headers.transfer_encoding = 'chunked';
    -- nginx would otherwise hold the chunks back.
    response.headers.x_accel_buffering = 'no';
    response:write_headers();

    local stream = { response = response; conference = conference; opened = os.time(); session = session;
        token_key = session and hashes.sha256(session.auth_token, true);
        allowed = setmetatable({}, { __mode = 'k' }); };
    streams[stream] = true;
    shared.count = shared.count + 1;
    response.on_destroy = function()
        close_stream(stream, 'disconnected');
    end;

    local missed = missed_frames(request.headers['last_event_id'], stream);
    if missed then
        for _, frame in ipairs(missed) do
            stream_write(stream, frame);
        end
    else
        stream_write(stream, sse_frame(event_id(shared.seq), 'snapshot',
            encode_snapshot(conference, snapshot_agents(stream))));
    end
    arm_keepalive();
    module:log('debug', 'Event stream opened for %s, %d open', conference or 'every room', shared.count);
    return nil;
end

-- GET /voice-agent/events: a text/event-stream of the lifecycle events, held open until the client leaves or the
-- stream reaches its max age. Not wrapped by async_handler_wrapper, which would end the response: the token check
-- may fetch an ASAP key, which has to wait, so it runs in its own runner, and the stream then takes the response over.
local function handle_events(event)
    -- The runner only calls its function for input it is given, so the event goes in run().
    async.runner(function(e)
        local refused, session = check_authorization(e.request);
        refused = refused or open_event_stream(e.request, e.response, session);
        if refused then
            e.response.status_code = refused.status_code;
            e.response:send(refused.body);
        end
    end):run(event);
    return true;
end

-- Internal lifecycle reporting for jicofo/JVB; drives the client-facing state and the webhooks.
local function handle_status(event)
    local request = event.request;

    local auth_error, session = check_status_authorization(request);
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
    local room_error = check_room_authorization(session, room);
    if room_error then
        return room_error;
    end
    if not STATUS_TRANSITIONS[payload.state] then
        return error_response(400, 'Invalid state');
    end
    local reason = type(payload.reason) == 'string' and public_reason(payload.reason) or nil;

    local entry, jicofo_entry, agent_id = get_agent(room, payload.agentId);
    if not entry then
        -- Also a repeated 'ended': the agent is gone, which reporters take as done.
        return error_response(404, 'Agent not found');
    end
    if STATE_RANK[payload.state] <= (STATE_RANK[entry.state] or 0) then
        module:log('debug', 'Ignoring stale status %s for agent %s in state %s',
            payload.state, agent_id, entry.state);
        return { status_code = 200, body = json.encode(agent_response(agent_id, entry)) };
    end
    if payload.state == STATE_ENDED then
        remove_agent(room, agent_id, reason or 'ended');
        return { status_code = 200, body = json.encode({ agentId = agent_id }) };
    end
    entry.state = payload.state;
    if payload.state == STATE_ACTIVE then
        notify_lifecycle(room, agent_id, entry, jicofo_entry.callbackUrl, 'agent.connected');
    elseif payload.state == STATE_FAILED then
        notify_lifecycle(room, agent_id, entry, jicofo_entry.callbackUrl, 'agent.failed', { reason = reason });
    end
    notify_metadata_changed(room);
    return { status_code = 200, body = json.encode(agent_response(agent_id, entry)) };
end

-- Internal: the media relay fetches the dial config by id when the bridge connects, so the customer
-- endpoint and its secret leave prosody only for the dial itself.
local function handle_dial(event)
    local request = event.request;

    local auth_error, session = check_dial_authorization(request);
    if auth_error then
        return auth_error;
    end

    local params = query_params(request);
    local room = find_room(params.conference);
    if not room then
        return error_response(404, 'Room not found');
    end
    local room_error = check_room_authorization(session, room);
    if room_error then
        return room_error;
    end
    local entry, jicofo_entry, agent_id = get_agent(room, params.agentId);
    if not entry or not jicofo_entry.endpoint then
        return error_response(404, 'Agent not found');
    end
    return { status_code = 200, body = json.encode({
        agentId = agent_id;
        conference = public_room_name(room);
        endpoint = jicofo_entry.endpoint;
        customParameters = jicofo_entry.customParameters;
        mediaFormat = jicofo_entry.mediaFormat;
        fanIn = jicofo_entry.fanIn;
    }) };
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
        ['GET voice-agent/dial'] = function(event)
            return async_handler_wrapper(event, handle_dial);
        end;
        ['GET voice-agent/events'] = handle_events;
    };
});

-- The conference (or breakout room) ending takes every agent with it; make that observable to the customer.
local function hook_room_destroyed(host_module)
    host_module:hook('muc-room-destroyed', function(event)
        local room = event.room;
        local agents = room.jitsiMetadata and room.jitsiMetadata.agents;
        if not agents then
            return;
        end
        local voice_agents = room._data.voice_agents or {};
        for agent_id, entry in pairs(agents) do
            -- The module may be loaded on several hosts (e.g. via global modules_enabled), each hooking
            -- the same room: the first run marks the agent ended so later runs stay silent. A failed agent
            -- already had its terminal webhook.
            if entry.state ~= STATE_ENDED and entry.state ~= STATE_FAILED then
                entry.state = STATE_ENDED;
                notify_lifecycle(room, agent_id, entry, (voice_agents[agent_id] or {}).callbackUrl,
                    'agent.ended', { reason = 'room-destroyed' });
            end
        end
        rooms_with_agents[room] = nil;
    -- Ahead of mod_muc forgetting the room (priority 0), so streams can still check it against a token.
    end, 1);
end

process_host_module(muc_component_host, hook_room_destroyed);
if breakout_rooms_component_host then
    process_host_module(breakout_rooms_component_host, hook_room_destroyed);
end

-- Prosody cancels this instance's timers on unload; the shared flag must not keep claiming a keepalive that is gone.
function module.unload()
    if keepalive_here then
        shared.keepalive_armed = false;
    end
end
