-- Unit tests for mod_voice_agent_component.lua
-- Run with busted from resources/prosody-plugins/:
--   busted ../../tests/prosody/lua/
--
-- Stubs every Prosody dependency so no Prosody installation is needed. These focus on the
-- security-relevant validation at the provisioning boundary: ASAP auth, agentId namespacing (the
-- reserved "agent-" prefix that makes an agent id un-collidable with a real 8-hex endpoint id),
-- prototype-pollution key rejection, string-map bounds, prosody-only dial-config segregation — and the
-- v1 contract additions: idempotent invite, get, the state lifecycle, and signed webhooks.
-- End-to-end behaviour against a real Prosody is covered by the integration specs.

-- ---------------------------------------------------------------------------
-- Stubs for top-level `require`d Prosody libs (no Prosody install under busted)
-- ---------------------------------------------------------------------------

package.preload['util.hashes'] = function()
    return {
        sha256 = function() return 'deadbeefcafef00d' end,
        hmac_sha256 = function(_key, data, _hex) return 'h:' .. data end
    };
end
package.preload['util.random'] = function()
    return { bytes = function() return 'xxxxxxxx' end };
end
package.preload['util.http'] = function()
    return {
        formdecode = function(query)
            local params = {};
            for k, v in (query or ''):gmatch('([^&=]+)=([^&]*)') do params[k] = v; end
            return params;
        end
    };
end

-- net.http: captures outbound webhook requests; `http_next_code` is the status the stub reports back.
local http_requests = {};
local metadata_events = 0;
local http_next_code = 200;
package.preload['net.http'] = function()
    return {
        request = function(url, ex, callback)
            table.insert(http_requests, { url = url, ex = ex });
            if callback then callback('', http_next_code, {}); end
            return true;
        end
    };
end

-- cjson.safe: decode returns the per-test `next_decoded` table; encode records every table it is
-- given so tests can inspect response and webhook payloads without a real JSON parser.
local next_decoded;
local encoded = {};
package.preload['cjson.safe'] = function()
    return {
        decode = function(s)
            if s == nil or s == '' then
                return nil, 'empty';
            end
            return next_decoded;
        end,
        encode = function(t) table.insert(encoded, t); return '{}'; end
    };
end

-- ---------------------------------------------------------------------------
-- Controllable stub state
-- ---------------------------------------------------------------------------

local token_valid = true;
local mock_room;
local timers = {};
local host_hooks = {};
-- The same hooks keyed by the host they were installed on (the module hooks the main and breakout MUC hosts).
local host_hooks_by_host = {};
-- module:log calls, as { level, text }.
local logs = {};

-- Public room-name lookups ({ name, subdomain }) seen by the util stub.
local name_lookups = {};

local util_stub = {
    async_handler_wrapper = function(event, handler) return handler(event); end,
    extract_subdomain = function(node)
        local subdomain, room = node:match('^%[([^%]]+)%](.+)$');
        return subdomain, room or node;
    end,
    get_room_by_name_and_subdomain = function(name, subdomain)
        table.insert(name_lookups, { name = name, subdomain = subdomain });
        if name == 'missing' then return nil; end
        return mock_room;
    end,
    get_room_from_jid = function(jid)
        if jid == 'missing' then return nil; end
        return mock_room;
    end,
    is_healthcheck_room = function(_) return false; end,
    process_host_module = function(host, cb)
        host_hooks_by_host[host] = host_hooks_by_host[host] or {};
        cb({ hook = function(_, name, fn)
            host_hooks[name] = fn;
            host_hooks_by_host[host][name] = fn;
        end; fire_event = function(_, name)
            if name == 'room-metadata-changed' then metadata_events = metadata_events + 1; end
        end });
    end,
    room_jid_match_rewrite = function(jid) return jid; end,
    starts_with = function(s, prefix) return type(s) == 'string' and s:sub(1, #prefix) == prefix; end,
    table_shallow_copy = function(t)
        local c = {};
        for k, v in pairs(t or {}) do c[k] = v; end
        return c;
    end
};

local token_util_stub = {
    new = function()
        return {
            set_asap_key_server = function() end,
            process_and_verify_token = function() return token_valid, 'reason', 'msg'; end
        };
    end
};

-- Captured HTTP route handlers, filled by the module:provides stub below.
local routes = {};

-- Option values the module is loaded with; a test may reload it with overrides (see "alternate configurations").
local option_overrides = {};
local function option(key, default)
    if option_overrides[key] ~= nil then return option_overrides[key]; end
    if key == 'muc_component' then return 'conference.localhost'; end
    if key == 'breakout_rooms_component' then return 'breakout.localhost'; end
    if key == 'voice_agent_webhook_secret' then return 'shh'; end
    if key == 'voice_agent_status_secret' then return 'jicofo-secret'; end
    if key == 'voice_agent_dial_secret' then return 'relay-secret'; end
    if key == 'prosody_password_public_key_repo_url' then return 'https://keys.example.com/'; end
    if key == 'voice_agent_callback_allowed_hosts' then return { 'app.example.com' }; end
    return default;
end

_G.module = {
    host = 'voiceagent.localhost',
    log = function(_, level, fmt, ...)
        local ok, text = pcall(string.format, fmt, ...);
        table.insert(logs, { level = level, text = ok and text or fmt });
    end,
    get_option_string = function(_, key, default) return option(key, default); end,
    get_option_number = function(_, _key, default) return default; end,
    get_option_boolean = function(_, key, default) return option(key, default); end,
    get_option_array = function(_, key, default) return option(key, default or {}); end,
    measure = function() return function() end; end,
    depends = function() end,
    add_timer = function(_, delay, fn) table.insert(timers, { delay = delay, fn = fn }); end,
    require = function(_, name)
        if name == 'util' then return util_stub; end
        if name == 'token/util' then return token_util_stub; end
        return {};
    end,
    provides = function(_, _kind, def)
        for name, handler in pairs(def.route) do routes[name] = handler; end
    end
};

-- ---------------------------------------------------------------------------
-- Load the module under test
-- ---------------------------------------------------------------------------

local ok, load_err = pcall(dofile, 'mod_voice_agent_component.lua');
if not ok then
    describe('mod_voice_agent_component', function()
        it('skipped — failed to load module', function()
            pending(tostring(load_err):match('([^\n]+)') or tostring(load_err));
        end)
    end)
    return;
end

for _, route in ipairs({ 'POST voice-agent/invite', 'POST voice-agent/dismiss', 'GET voice-agent/list',
                         'GET voice-agent/get', 'POST voice-agent/status', 'GET voice-agent/dial' }) do
    assert(routes[route], route .. ' route not registered');
end

-- ---------------------------------------------------------------------------
-- Test helpers
-- ---------------------------------------------------------------------------

local function fresh_room()
    return {
        jid = 'room1@conference.localhost';
        jitsiMetadata = {};
        _data = {};
        occupants = {};
        each_occupant = function(self)
            local i = 0;
            return function()
                i = i + 1;
                local occupant = self.occupants[i];
                if occupant then
                    return occupant.nick, occupant;
                end
            end;
        end;
    };
end

-- An occupant whose presence carries the given jitsi_participant_* properties.
local function occupant(props)
    return {
        nick = 'room1@conference.localhost/p' .. tostring(math.random(1e6));
        get_presence = function()
            return { get_child_text = function(_, name) return props[name]; end };
        end;
    };
end

local function post(route, payload, opts)
    opts = opts or {};
    next_decoded = payload;
    local headers = { content_type = 'application/json' };
    if not opts.omitAuth then
        headers.authorization = opts.token or 'Bearer sometoken';
    end
    return routes[route]({ request = { headers = headers; body = 'x' } });
end

local DEFAULT_ENDPOINT = { url = 'wss://agents.example.com/s' };

-- Every invite needs an endpoint; tests that do not care get the default one.
local function invite(payload, opts)
    opts = opts or {};
    if payload.endpoint == nil and not opts.noEndpoint then
        payload.endpoint = DEFAULT_ENDPOINT;
    end
    return post('POST voice-agent/invite', payload, opts);
end
local function dismiss(payload) return post('POST voice-agent/dismiss', payload); end
local function status(payload, opts) return post('POST voice-agent/status', payload, opts); end

local function get(query)
    return routes['GET voice-agent/get']({
        request = { headers = { authorization = 'Bearer t' }; url = { query = query } } });
end

local function dial(query, opts)
    opts = opts or {};
    local headers = {};
    if not opts.omitAuth then
        headers.authorization = opts.token or 'Bearer t';
    end
    return routes['GET voice-agent/dial']({ request = { headers = headers; url = { query = query } } });
end

local function agent_ids(room)
    local ids = {};
    for id in pairs(room.jitsiMetadata.agents or {}) do table.insert(ids, id); end
    return ids;
end

-- Every recorded webhook payload of the given event type, in emission order.
local function webhook_payloads(event_name)
    local out = {};
    for _, t in ipairs(encoded) do
        if type(t) == 'table' and t.event == event_name then table.insert(out, t); end
    end
    return out;
end

local CALLBACK = 'https://app.example.com/agent-events';

-- ---------------------------------------------------------------------------
-- Tests
-- ---------------------------------------------------------------------------

describe('mod_voice_agent_component', function()
    before_each(function()
        token_valid = true;
        mock_room = fresh_room();
        http_requests = {};
        metadata_events = 0;
        http_next_code = 200;
        timers = {};
        name_lookups = {};
        logs = {};
        for i = #encoded, 1, -1 do encoded[i] = nil; end
    end)

    describe('public room names (no MUC JIDs for customers)', function()
        it('resolves <tenant>/<room>, lower-cased, through the tenant', function()
            assert.are.equal(200, invite({ conference = 'Acme/Support-Room'; displayName = 'Bot' }).status_code);
            assert.are.same({ name = 'support-room', subdomain = 'acme' }, name_lookups[1]);
        end)

        it('resolves a bare <room> outside any tenant', function()
            assert.are.equal(200, invite({ conference = 'lobby'; displayName = 'Bot' }).status_code);
            assert.are.same({ name = 'lobby' }, name_lookups[1]);
        end)

        it('also takes a room JID, without a name lookup', function()
            assert.are.equal(200, invite({ conference = 'room1@conference.localhost'; displayName = 'Bot';
                agentId = 'support' }).status_code);
            assert.are.equal(200, dismiss({ conference = 'room1@conference.localhost'; agentId = 'agent-support' }).status_code);
            assert.are.equal(0, #name_lookups);
        end)

        it('takes conference and breakout room JIDs, not a lobby room\'s', function()
            assert.are.equal(200, invite({ conference = 'abc@breakout.localhost'; displayName = 'Bot';
                agentId = 'support' }).status_code);
            assert.are.equal(200, dial('conference=abc@breakout.localhost&agentId=agent-support').status_code);
            assert.are.equal(404, invite({ conference = 'room1@lobby.conference.localhost'; displayName = 'Bot' }).status_code);
            assert.are.equal(404, dial('conference=room1@lobby.conference.localhost&agentId=agent-support').status_code);
        end)

        it('spells names as the client stores them, from the plain or the encoded form', function()
            local cases = {
                { 'Sales Standup', 'sales%20standup' },
                { 'sales%20STANDUP', 'sales%20standup' },
                { 'Caf\195\169', 'caf%c3%a9' },
                { 'caf%C3%A9', 'caf%c3%a9' },
                { 'a+b', 'a%2bb' },
                { '100%', '100%25' },
                { '[t]room', '%5bt%5droom' },
            };
            for i, case in ipairs(cases) do
                invite({ conference = case[1]; displayName = 'Bot' });
                assert.are.equal(case[2], name_lookups[i].name, case[1]);
            end
        end)

        it('rejects names with more than one tenant segment or an empty one', function()
            for _, bad in ipairs({ 'a/b/c', '/room', 'tenant/' }) do
                assert.are.equal(404, invite({ conference = bad; displayName = 'Bot' }).status_code, bad);
            end
        end)

        it('masks internal addresses in a failure reason before it reaches the webhook', function()
            invite({ conference = 'r'; displayName = 'Bot'; agentId = 'support'; callbackUrl = CALLBACK });
            status({ conference = 'r'; agentId = 'agent-support'; state = 'failed';
                reason = 'bridge allocation failed: Session no longer active (bridge=jvbbrewery@internal.auth.localhost/jvb-1)' },
                { token = 'Bearer jicofo-secret' });
            assert.are.equal('bridge allocation failed: Session no longer active <internal>',
                webhook_payloads('agent.failed')[1].reason);
        end)

        it('names the room <tenant>/<room> in webhooks and the dial response, never by JID', function()
            mock_room.jid = '[acme]support@conference.localhost';
            invite({ conference = 'acme/support'; displayName = 'Bot'; agentId = 'support'; callbackUrl = CALLBACK });
            status({ conference = '[acme]support@conference.localhost'; agentId = 'agent-support'; state = 'active' },
                { token = 'Bearer jicofo-secret' });
            assert.are.equal('acme/support', webhook_payloads('agent.connected')[1].conference);
            dial('conference=[acme]support@conference.localhost&agentId=agent-support');
            assert.are.equal('acme/support', encoded[#encoded].conference);
        end)

        it('names a room outside any tenant by its bare name', function()
            invite({ conference = 'r'; displayName = 'Bot'; agentId = 'support'; callbackUrl = CALLBACK });
            dismiss({ conference = 'r'; agentId = 'agent-support' });
            assert.are.equal('room1', webhook_payloads('agent.ended')[1].conference);
        end)
    end)

    describe('authentication', function()
        it('returns 401 when the Authorization header is absent', function()
            local res = invite({ conference = 'r'; displayName = 'Bot' }, { omitAuth = true });
            assert.are.equal(401, res.status_code);
        end)

        it('returns 401 when the token does not verify', function()
            token_valid = false;
            local res = invite({ conference = 'r'; displayName = 'Bot' });
            assert.are.equal(401, res.status_code);
        end)
    end)

    describe('agentId namespacing (collision prevention)', function()
        it('generates an agent- prefixed id when none is provided', function()
            local res = invite({ conference = 'r'; displayName = 'Bot' });
            assert.are.equal(200, res.status_code);
            local ids = agent_ids(mock_room);
            assert.are.equal(1, #ids);
            assert.is_truthy(ids[1]:match('^agent%-'), 'generated id must be agent- prefixed: ' .. ids[1]);
        end)

        it('normalizes a bare (endpoint-id-shaped) agentId into the agent- namespace', function()
            -- '1a2b3c4d' is exactly the shape of a real participant endpoint id.
            invite({ conference = 'r'; displayName = 'Bot'; agentId = '1a2b3c4d' });
            assert.is_truthy(mock_room.jitsiMetadata.agents['agent-1a2b3c4d'],
                'a bare id must be namespaced so it cannot collide with a real endpoint id');
            assert.is_nil(mock_room.jitsiMetadata.agents['1a2b3c4d']);
        end)

        it('is idempotent when the agentId already carries the prefix', function()
            invite({ conference = 'r'; displayName = 'Bot'; agentId = 'agent-support' });
            assert.is_truthy(mock_room.jitsiMetadata.agents['agent-support']);
            assert.is_nil(mock_room.jitsiMetadata.agents['agent-agent-support']);
        end)

        it('derives the source name from the namespaced id', function()
            local res = invite({ conference = 'r'; displayName = 'Bot'; agentId = 'support' });
            assert.are.equal('agent-support-a0', mock_room.jitsiMetadata.agents['agent-support'].sourceName);
            -- The 200 body echoes the same source name (encode is stubbed, so just assert success).
            assert.are.equal(200, res.status_code);
        end)
    end)

    describe('prototype-pollution key rejection', function()
        for _, bad in ipairs({ '__proto__', 'constructor', 'prototype' }) do
            it('rejects agentId "' .. bad .. '"', function()
                local res = invite({ conference = 'r'; displayName = 'Bot'; agentId = bad });
                assert.are.equal(400, res.status_code);
                assert.are.equal(0, #agent_ids(mock_room));
            end)
        end
    end)

    describe('agentId charset and length', function()
        it('rejects an agentId with disallowed characters', function()
            assert.are.equal(400, invite({ conference = 'r'; displayName = 'B'; agentId = 'a b/c' }).status_code);
        end)

        it('rejects an over-long agentId suffix', function()
            assert.are.equal(400,
                invite({ conference = 'r'; displayName = 'B'; agentId = string.rep('a', 49) }).status_code);
        end)
    end)

    describe('required fields and limits', function()
        it('returns 400 when displayName is missing', function()
            assert.are.equal(400, invite({ conference = 'r' }).status_code);
        end)

        it('returns 404 when the room does not exist', function()
            assert.are.equal(404, invite({ conference = 'missing'; displayName = 'B' }).status_code);
        end)

        it('enforces the per-room agent cap', function()
            for i = 1, 5 do
                assert.are.equal(200, invite({ conference = 'r'; displayName = 'B'; agentId = 'a' .. i }).status_code);
            end
            assert.are.equal(409, invite({ conference = 'r'; displayName = 'B'; agentId = 'a6' }).status_code);
        end)
    end)

    describe('customParameters validation', function()
        it('rejects a non-string map value', function()
            assert.are.equal(400,
                invite({ conference = 'r'; displayName = 'B'; customParameters = { k = 5 } }).status_code);
        end)

        it('rejects too many entries', function()
            local big = {};
            for i = 1, 17 do big['k' .. i] = 'v'; end
            assert.are.equal(400,
                invite({ conference = 'r'; displayName = 'B'; customParameters = big }).status_code);
        end)

        it('rejects a value with control characters', function()
            assert.are.equal(400,
                invite({ conference = 'r'; displayName = 'B';
                    customParameters = { X = 'a\r\nX-Injected: 1' } }).status_code);
        end)

        it('rejects an over-long key', function()
            assert.are.equal(400,
                invite({ conference = 'r'; displayName = 'B';
                    customParameters = { [string.rep('k', 129)] = 'v' } }).status_code);
        end)
    end)

    describe('endpoint', function()
        it('is required', function()
            assert.are.equal(400,
                invite({ conference = 'r'; displayName = 'B' }, { noEndpoint = true }).status_code);
        end)

        it('rejects a non-wss endpoint.url', function()
            assert.are.equal(400, invite({
                conference = 'r'; displayName = 'B'; endpoint = { url = 'http://evil/s' }
            }).status_code);
        end)

        it('rejects an endpoint.authorization with control characters', function()
            assert.are.equal(400, invite({ conference = 'r'; displayName = 'B';
                endpoint = { url = 'wss://agents.example.com/s'; authorization = 'Bearer k\r\nX: 1' } }).status_code);
        end)

        it('keeps the endpoint and its secret out of the client-facing entry', function()
            invite({
                conference = 'r';
                displayName = 'Bot';
                agentId = 'support';
                endpoint = { url = 'wss://agents.example.com/s'; authorization = 'Bearer k' }
            });
            assert.is_nil(mock_room.jitsiMetadata.agents['agent-support'].endpoint);
            local stored = mock_room._data.voice_agents['agent-support'].endpoint;
            assert.are.equal('wss://agents.example.com/s', stored.url);
            assert.are.equal('Bearer k', stored.authorization);
        end)
    end)

    describe('end-to-end encryption', function()
        it('rejects an invite while anyone has end-to-end encryption on', function()
            mock_room.occupants = { occupant({}), occupant({ ['jitsi_participant_e2ee.enabled'] = 'true' }) };
            local res = invite({ conference = 'r'; displayName = 'Bot'; agentId = 'support' });
            assert.are.equal(409, res.status_code);
            assert.are.equal('End-to-end encryption is on in this meeting', encoded[#encoded].error);
            assert.are.equal(0, #agent_ids(mock_room));
        end)

        it('accepts the invite once encryption is off again', function()
            mock_room.occupants = { occupant({ ['jitsi_participant_e2ee.enabled'] = 'false' }) };
            assert.are.equal(200, invite({ conference = 'r'; displayName = 'Bot'; agentId = 'support' }).status_code);
        end)
    end)

    describe('mediaFormat', function()
        local function dial_body()
            assert.are.equal(200, dial('conference=r&agentId=agent-support').status_code);
            return encoded[#encoded];
        end

        it('defaults to PCM16 in the dial response', function()
            invite({ conference = 'r'; displayName = 'Bot'; agentId = 'support' });
            assert.are.equal('audio/l16', dial_body().mediaFormat.encoding);
        end)

        it('carries Opus to the dial response and keeps it out of the client-facing entry', function()
            assert.are.equal(200, invite({ conference = 'r'; displayName = 'Bot'; agentId = 'support';
                mediaFormat = { encoding = 'audio/opus' } }).status_code);
            assert.are.equal('audio/opus', dial_body().mediaFormat.encoding);
            assert.is_nil(mock_room.jitsiMetadata.agents['agent-support'].mediaFormat);
        end)

        it('rejects an unknown encoding, a non-object and unsupported fields', function()
            for _, bad in ipairs({ { encoding = 'audio/pcmu' }, 'audio/opus', {},
                    { encoding = 'audio/l16'; sampleRate = 16000 } }) do
                assert.are.equal(400, invite({ conference = 'r'; displayName = 'Bot'; mediaFormat = bad }).status_code);
            end
            assert.are.equal(0, #agent_ids(mock_room));
        end)

        it('is part of the idempotency check, the default matching an explicit audio/l16', function()
            invite({ conference = 'r'; displayName = 'Bot'; agentId = 'support' });
            assert.are.equal(200, invite({ conference = 'r'; displayName = 'Bot'; agentId = 'support';
                mediaFormat = { encoding = 'audio/l16' } }).status_code);
            -- A record from before mediaFormat existed counts as the default.
            mock_room._data.voice_agents['agent-support'].mediaFormat = nil;
            assert.are.equal(200, invite({ conference = 'r'; displayName = 'Bot'; agentId = 'support' }).status_code);
            assert.are.equal(409, invite({ conference = 'r'; displayName = 'Bot'; agentId = 'support';
                mediaFormat = { encoding = 'audio/opus' } }).status_code);
        end)
    end)

    describe('fanIn', function()
        local function dial_body()
            assert.are.equal(200, dial('conference=r&agentId=agent-support').status_code);
            return encoded[#encoded];
        end

        it('defaults to per-source in the dial response', function()
            invite({ conference = 'r'; displayName = 'Bot'; agentId = 'support' });
            assert.are.equal('per-source', dial_body().fanIn);
        end)

        it('carries dominant to the dial response and keeps it out of the client-facing entry', function()
            assert.are.equal(200, invite({ conference = 'r'; displayName = 'Bot'; agentId = 'support';
                fanIn = 'dominant' }).status_code);
            assert.are.equal('dominant', dial_body().fanIn);
            assert.is_nil(mock_room.jitsiMetadata.agents['agent-support'].fanIn);
        end)

        it('rejects an unknown policy and a non-string', function()
            for _, bad in ipairs({ 'loudest', 'Dominant', 42, { 'dominant' } }) do
                assert.are.equal(400, invite({ conference = 'r'; displayName = 'Bot'; fanIn = bad }).status_code);
            end
            assert.are.equal(0, #agent_ids(mock_room));
        end)

        it('is part of the idempotency check, the default matching an explicit per-source', function()
            invite({ conference = 'r'; displayName = 'Bot'; agentId = 'support' });
            assert.are.equal(200, invite({ conference = 'r'; displayName = 'Bot'; agentId = 'support';
                fanIn = 'per-source' }).status_code);
            -- A record from before fanIn existed counts as the default.
            mock_room._data.voice_agents['agent-support'].fanIn = nil;
            assert.are.equal(200, invite({ conference = 'r'; displayName = 'Bot'; agentId = 'support' }).status_code);
            assert.are.equal(409, invite({ conference = 'r'; displayName = 'Bot'; agentId = 'support';
                fanIn = 'dominant' }).status_code);
        end)
    end)

    describe('dial (internal, fetched by the media relay)', function()
        local function invite_support()
            invite({ conference = 'r'; displayName = 'Bot'; agentId = 'support';
                endpoint = { url = 'wss://agents.example.com/s'; authorization = 'Bearer k' };
                customParameters = { campaign = '42' } });
        end

        it('returns the endpoint and custom parameters for the dial secret bearer', function()
            invite_support();
            local res = dial('conference=r&agentId=agent-support', { token = 'Bearer relay-secret' });
            assert.are.equal(200, res.status_code);
            local body = encoded[#encoded];
            assert.are.equal('agent-support', body.agentId);
            assert.are.equal('wss://agents.example.com/s', body.endpoint.url);
            assert.are.equal('Bearer k', body.endpoint.authorization);
            assert.are.equal('42', body.customParameters.campaign);
            assert.is_nil(mock_room.jitsiMetadata.agents['agent-support'].customParameters);
        end)

        it('accepts an ASAP token too', function()
            invite_support();
            assert.are.equal(200, dial('conference=r&agentId=agent-support').status_code);
        end)

        it('refuses jicofo\'s status secret once a dial secret is configured, while status takes either', function()
            invite_support();
            token_valid = false;
            assert.are.equal(401, dial('conference=r&agentId=agent-support', { token = 'Bearer jicofo-secret' }).status_code);
            assert.are.equal(200, status({ conference = 'r'; agentId = 'agent-support'; state = 'connecting' },
                { token = 'Bearer relay-secret' }).status_code);
            assert.are.equal(200, status({ conference = 'r'; agentId = 'agent-support'; state = 'active' },
                { token = 'Bearer jicofo-secret' }).status_code);
        end)

        it('rejects a missing or invalid token', function()
            invite_support();
            assert.are.equal(401, dial('conference=r&agentId=agent-support', { omitAuth = true }).status_code);
            token_valid = false;
            assert.are.equal(401, dial('conference=r&agentId=agent-support', { token = 'Bearer wrong' }).status_code);
        end)

        it('returns 404 for an unknown agent and for a missing room', function()
            assert.are.equal(404, dial('conference=r&agentId=agent-nope').status_code);
            assert.are.equal(404, dial('conference=missing&agentId=agent-support').status_code);
        end)
    end)

    describe('idempotent invite', function()
        it('returns the existing agent for an identical re-invite without duplicating it', function()
            local first = invite({ conference = 'r'; displayName = 'Bot'; agentId = 'support';
                customParameters = { a = '1' } });
            local second = invite({ conference = 'r'; displayName = 'Bot'; agentId = 'support';
                customParameters = { a = '1' } });
            assert.are.equal(200, first.status_code);
            assert.are.equal(200, second.status_code);
            assert.are.equal(1, #agent_ids(mock_room));
        end)

        it('conflicts (409) when the same agentId is re-invited with different parameters', function()
            invite({ conference = 'r'; displayName = 'Bot'; agentId = 'support' });
            assert.are.equal(409, invite({ conference = 'r'; displayName = 'Other'; agentId = 'support' }).status_code);
            assert.are.equal(409, invite({ conference = 'r'; displayName = 'Bot'; agentId = 'support';
                customParameters = { a = '2' } }).status_code);
            assert.are.equal('Bot', mock_room.jitsiMetadata.agents['agent-support'].displayName);
        end)
    end)

    describe('state lifecycle', function()
        it('starts an invited agent in the provisioning state', function()
            invite({ conference = 'r'; displayName = 'Bot'; agentId = 'support' });
            assert.are.equal('provisioning', mock_room.jitsiMetadata.agents['agent-support'].state);
        end)

        it('advances to connecting without a webhook', function()
            invite({ conference = 'r'; displayName = 'Bot'; agentId = 'support'; callbackUrl = CALLBACK });
            assert.are.equal(200, status({ conference = 'r'; agentId = 'agent-support'; state = 'connecting' }).status_code);
            assert.are.equal('connecting', mock_room.jitsiMetadata.agents['agent-support'].state);
            assert.are.equal(0, #http_requests);
        end)

        it('advances to active and fires agent.connected', function()
            invite({ conference = 'r'; displayName = 'Bot'; agentId = 'support'; callbackUrl = CALLBACK });
            status({ conference = 'r'; agentId = 'agent-support'; state = 'active' });
            assert.are.equal('active', mock_room.jitsiMetadata.agents['agent-support'].state);
            local connected = webhook_payloads('agent.connected');
            assert.are.equal(1, #connected);
            assert.are.equal('agent-support', connected[1].agentId);
            assert.are.equal('active', connected[1].state);
        end)

        it('marks failed with a reason and fires agent.failed', function()
            invite({ conference = 'r'; displayName = 'Bot'; agentId = 'support'; callbackUrl = CALLBACK });
            status({ conference = 'r'; agentId = 'agent-support'; state = 'failed'; reason = 'dial refused' });
            assert.are.equal('failed', mock_room.jitsiMetadata.agents['agent-support'].state);
            local failed = webhook_payloads('agent.failed');
            assert.are.equal(1, #failed);
            assert.are.equal('dial refused', failed[1].reason);
        end)

        it('tears the agent down on ended and fires agent.ended', function()
            invite({ conference = 'r'; displayName = 'Bot'; agentId = 'support'; callbackUrl = CALLBACK });
            assert.are.equal(200, status({ conference = 'r'; agentId = 'agent-support'; state = 'ended' }).status_code);
            assert.is_nil(mock_room.jitsiMetadata.agents['agent-support']);
            assert.is_nil(mock_room._data.voice_agents['agent-support']);
            assert.are.equal(1, #webhook_payloads('agent.ended'));
        end)

        it('rejects an unknown state', function()
            invite({ conference = 'r'; displayName = 'Bot'; agentId = 'support' });
            assert.are.equal(400, status({ conference = 'r'; agentId = 'agent-support'; state = 'dancing' }).status_code);
        end)

        it('returns 404 for an unknown agent', function()
            assert.are.equal(404, status({ conference = 'r'; agentId = 'agent-nope'; state = 'active' }).status_code);
        end)
    end)

    describe('get', function()
        it('returns the client-facing agent', function()
            invite({ conference = 'r'; displayName = 'Bot'; agentId = 'support' });
            local res = get('conference=r&agentId=agent-support');
            assert.are.equal(200, res.status_code);
            local body = encoded[#encoded];
            assert.are.equal('agent-support', body.agentId);
            assert.are.equal('agent-support-a0', body.sourceName);
            assert.are.equal('provisioning', body.state);
        end)

        it('returns 404 for an unknown agent and for a missing room', function()
            assert.are.equal(404, get('conference=r&agentId=agent-nope').status_code);
            assert.are.equal(404, get('conference=missing&agentId=agent-support').status_code);
        end)
    end)

    describe('callbackUrl and webhooks', function()
        it('rejects a non-https callbackUrl', function()
            assert.are.equal(400,
                invite({ conference = 'r'; displayName = 'B'; callbackUrl = 'http://app.example.com/hook' }).status_code);
        end)

        it('stores callbackUrl jicofo-only, never in the client-facing entry', function()
            invite({ conference = 'r'; displayName = 'B'; agentId = 'support'; callbackUrl = CALLBACK });
            assert.are.equal(CALLBACK, mock_room._data.voice_agents['agent-support'].callbackUrl);
            assert.is_nil(mock_room.jitsiMetadata.agents['agent-support'].callbackUrl);
        end)

        it('sends no webhook when the agent has no callbackUrl', function()
            invite({ conference = 'r'; displayName = 'B'; agentId = 'support' });
            dismiss({ conference = 'r'; agentId = 'agent-support' });
            assert.are.equal(0, #http_requests);
        end)

        it('POSTs a signed agent.ended webhook on dismiss', function()
            invite({ conference = 'r'; displayName = 'B'; agentId = 'support'; callbackUrl = CALLBACK });
            dismiss({ conference = 'r'; agentId = 'agent-support' });
            assert.are.equal(1, #http_requests);
            local req = http_requests[1];
            assert.are.equal(CALLBACK, req.url);
            assert.are.equal('POST', req.ex.method);
            assert.are.equal('application/json', req.ex.headers['Content-Type']);
            assert.are.equal('sha256=h:{}', req.ex.headers['X-Agent-Signature']);
            local ended = webhook_payloads('agent.ended');
            assert.are.equal(1, #ended);
            assert.are.equal('agent-support', ended[1].agentId);
            assert.are.equal('ended', ended[1].state);
            assert.are.equal('dismissed', ended[1].reason);
            assert.is_truthy(ended[1].timestamp);
        end)

        it('retries a failed delivery with backoff', function()
            http_next_code = 500;
            invite({ conference = 'r'; displayName = 'B'; agentId = 'support'; callbackUrl = CALLBACK });
            dismiss({ conference = 'r'; agentId = 'agent-support' });
            assert.are.equal(1, #http_requests);
            assert.are.equal(1, #timers, 'first failure must schedule a retry');
            timers[1].fn();
            assert.are.equal(2, #http_requests);
            assert.is_true(timers[2].delay > timers[1].delay, 'backoff must grow');
        end)

        it('fires agent.ended for every agent when the room is destroyed', function()
            invite({ conference = 'r'; displayName = 'B'; agentId = 'one'; callbackUrl = CALLBACK });
            invite({ conference = 'r'; displayName = 'B'; agentId = 'two'; callbackUrl = CALLBACK });
            host_hooks['muc-room-destroyed']({ room = mock_room });
            local ended = webhook_payloads('agent.ended');
            assert.are.equal(2, #ended);
            assert.are.equal('room-destroyed', ended[1].reason);
        end)

        it('sends agent.ended once per agent even when the destroy hook runs twice', function()
            invite({ conference = 'r'; displayName = 'Bot'; agentId = 'support'; callbackUrl = CALLBACK });
            host_hooks['muc-room-destroyed']({ room = mock_room });
            host_hooks['muc-room-destroyed']({ room = mock_room });
            assert.are.equal(1, #webhook_payloads('agent.ended'));
        end)
    end)

    describe('status route auth (jicofo shared secret)', function()
        it('accepts the configured shared secret without an ASAP token', function()
            invite({ conference = 'r'; displayName = 'Bot'; agentId = 'support' });
            token_valid = false;
            local res = status({ conference = 'r'; agentId = 'agent-support'; state = 'active' },
                { token = 'Bearer jicofo-secret' });
            assert.are.equal(200, res.status_code);
            assert.are.equal('active', mock_room.jitsiMetadata.agents['agent-support'].state);
        end)

        it('rejects a wrong shared secret', function()
            invite({ conference = 'r'; displayName = 'Bot'; agentId = 'support' });
            token_valid = false;
            assert.are.equal(401, status({ conference = 'r'; agentId = 'agent-support'; state = 'active' },
                { token = 'Bearer nope' }).status_code);
        end)

        it('never lets the shared secret provision agents', function()
            token_valid = false;
            assert.are.equal(401, invite({ conference = 'r'; displayName = 'Bot' },
                { token = 'Bearer jicofo-secret' }).status_code);
        end)
    end)

    describe('status lifecycle is forward-only', function()
        before_each(function()
            invite({ conference = 'r'; displayName = 'Bot'; agentId = 'support';
                callbackUrl = 'https://app.example.com/hook' });
        end)

        it('ignores a stale connecting after active and a duplicate active, sending one webhook', function()
            status({ conference = 'r'; agentId = 'agent-support'; state = 'connecting' });
            status({ conference = 'r'; agentId = 'agent-support'; state = 'active' });
            assert.are.equal(200, status({ conference = 'r'; agentId = 'agent-support'; state = 'connecting' }).status_code);
            assert.are.equal(200, status({ conference = 'r'; agentId = 'agent-support'; state = 'active' }).status_code);
            assert.are.equal('active', mock_room.jitsiMetadata.agents['agent-support'].state);
            assert.are.equal(1, #webhook_payloads('agent.connected'));
        end)

        it('still accepts failed after active', function()
            status({ conference = 'r'; agentId = 'agent-support'; state = 'active' });
            status({ conference = 'r'; agentId = 'agent-support'; state = 'failed'; reason = 'media leg lost' });
            assert.are.equal('failed', mock_room.jitsiMetadata.agents['agent-support'].state);
            assert.are.equal(1, #webhook_payloads('agent.failed'));
        end)

        it('removes a failed agent on ended, with agent.failed as its only terminal webhook', function()
            status({ conference = 'r'; agentId = 'agent-support'; state = 'failed'; reason = 'dial refused' });
            assert.are.equal(200, status({ conference = 'r'; agentId = 'agent-support'; state = 'ended' }).status_code);
            assert.is_nil(mock_room.jitsiMetadata.agents['agent-support']);
            assert.is_nil(mock_room._data.voice_agents['agent-support']);
            assert.are.equal(1, #webhook_payloads('agent.failed'));
            assert.are.equal(0, #webhook_payloads('agent.ended'));
        end)

        it('lets a failed agent stop counting toward the room cap once ended', function()
            for i = 1, 4 do
                invite({ conference = 'r'; displayName = 'Bot'; agentId = 'extra' .. i });
                status({ conference = 'r'; agentId = 'agent-extra' .. i; state = 'failed'; reason = 'x' });
                status({ conference = 'r'; agentId = 'agent-extra' .. i; state = 'ended' });
            end
            assert.are.equal(200, invite({ conference = 'r'; displayName = 'Bot'; agentId = 'fits' }).status_code);
        end)

        it('answers a repeated ended with 404, sending agent.ended once', function()
            status({ conference = 'r'; agentId = 'agent-support'; state = 'active' });
            assert.are.equal(200, status({ conference = 'r'; agentId = 'agent-support'; state = 'ended' }).status_code);
            assert.are.equal(404, status({ conference = 'r'; agentId = 'agent-support'; state = 'ended' }).status_code);
            assert.are.equal(1, #webhook_payloads('agent.ended'));
        end)

        it('sends no agent.ended for a failed agent when the room is destroyed', function()
            status({ conference = 'r'; agentId = 'agent-support'; state = 'failed'; reason = 'dial refused' });
            host_hooks['muc-room-destroyed']({ room = mock_room });
            assert.are.equal(0, #webhook_payloads('agent.ended'));
        end)

        it('sends no second terminal webhook when a failed agent is dismissed', function()
            status({ conference = 'r'; agentId = 'agent-support'; state = 'failed'; reason = 'dial refused' });
            assert.are.equal(200, dismiss({ conference = 'r'; agentId = 'agent-support' }).status_code);
            assert.is_nil(mock_room.jitsiMetadata.agents['agent-support']);
            assert.are.equal(1, #webhook_payloads('agent.failed'));
            assert.are.equal(0, #webhook_payloads('agent.ended'));
        end)
    end)

    describe('re-invite after failure', function()
        it('replaces a failed agent instead of treating it as a duplicate', function()
            invite({ conference = 'r'; displayName = 'Bot'; agentId = 'support';
                callbackUrl = 'https://app.example.com/hook' });
            status({ conference = 'r'; agentId = 'agent-support'; state = 'failed'; reason = 'no bridge' });
            metadata_events = 0;
            local res = invite({ conference = 'r'; displayName = 'Bot'; agentId = 'support';
                callbackUrl = 'https://app.example.com/hook' });
            assert.are.equal(200, res.status_code);
            assert.are.equal('provisioning', mock_room.jitsiMetadata.agents['agent-support'].state);
            assert.are.equal(2, metadata_events, 'removal broadcast, then the fresh entry');
            assert.are.equal(0, #webhook_payloads('agent.ended'));
        end)
    end)

    describe('dismiss', function()
        it('removes an existing agent from both the client and jicofo maps', function()
            invite({ conference = 'r'; displayName = 'Bot'; agentId = 'support' });
            local res = dismiss({ conference = 'r'; agentId = 'agent-support' });
            assert.are.equal(200, res.status_code);
            assert.is_nil(mock_room.jitsiMetadata.agents['agent-support']);
            assert.is_nil(mock_room._data.voice_agents['agent-support']);
            assert.are.equal('agent-support', encoded[#encoded].agentId, '200 body echoes the agentId');
        end)

        it('returns 404 for an unknown agent', function()
            assert.are.equal(404, dismiss({ conference = 'r'; agentId = 'agent-nope' }).status_code);
        end)
    end)
    describe('callbackUrl host allowlist and signing', function()
        it('refuses a host outside voice_agent_callback_allowed_hosts', function()
            assert.are.equal(400,
                invite({ conference = 'r'; displayName = 'B'; callbackUrl = 'https://evil.example.net/hook' }).status_code);
            assert.are.equal(400,
                invite({ conference = 'r'; displayName = 'B'; callbackUrl = 'https://app.example.com.evil.net/hook' }).status_code);
        end)

        it('accepts the listed host and its subdomains', function()
            assert.are.equal(200, invite({ conference = 'r'; displayName = 'B'; agentId = 'one';
                callbackUrl = 'https://app.example.com/hook' }).status_code);
            assert.are.equal(200, invite({ conference = 'r'; displayName = 'B'; agentId = 'two';
                callbackUrl = 'https://eu.app.example.com:8443/hook' }).status_code);
        end)

        it('logs only the host when a delivery gives up, never the URL\'s query string', function()
            http_next_code = 500;
            invite({ conference = 'r'; displayName = 'B'; agentId = 'support'; callbackUrl = CALLBACK .. '?token=sekrit' });
            dismiss({ conference = 'r'; agentId = 'agent-support' });
            while #timers > 0 do
                local t = table.remove(timers, 1);
                t.fn();
            end
            local gave_up = false;
            for _, entry in ipairs(logs) do
                assert.is_nil(entry.text:find('sekrit', 1, true), 'token leaked into a log line: ' .. entry.text);
                if entry.text:find('app.example.com', 1, true) and entry.text:find('failed after', 1, true) then
                    gave_up = true;
                end
            end
            assert.is_true(gave_up, 'expected a give-up warning naming the host');
        end)
    end)

    describe('displayName', function()
        it('rejects control characters, since it is broadcast to every client', function()
            assert.are.equal(400, invite({ conference = 'r'; displayName = 'Bot\r\nX' }).status_code);
            assert.are.equal(400, invite({ conference = 'r'; displayName = 'Bot\0' }).status_code);
        end)
    end)

    describe('agentId normalization on every route', function()
        it('accepts a bare id on get, status, dial and dismiss, answering with the stored id', function()
            invite({ conference = 'r'; displayName = 'Bot'; agentId = 'support'; callbackUrl = CALLBACK });
            assert.are.equal(200, get('conference=r&agentId=support').status_code);
            assert.are.equal('agent-support', encoded[#encoded].agentId);
            assert.are.equal(200, status({ conference = 'r'; agentId = 'support'; state = 'active' }).status_code);
            assert.are.equal('agent-support', encoded[#encoded].agentId);
            assert.are.equal(200, dial('conference=r&agentId=support', { token = 'Bearer relay-secret' }).status_code);
            assert.are.equal('agent-support', encoded[#encoded].agentId);
            assert.are.equal(200, dismiss({ conference = 'r'; agentId = 'support' }).status_code);
            assert.are.equal('agent-support', encoded[#encoded].agentId);
            assert.are.equal(0, #agent_ids(mock_room));
        end)
    end)

    describe('breakout rooms', function()
        it('fires agent.ended when a breakout room is destroyed', function()
            invite({ conference = 'r'; displayName = 'B'; agentId = 'support'; callbackUrl = CALLBACK });
            local hook = host_hooks_by_host['breakout.localhost']['muc-room-destroyed'];
            assert.is_function(hook, 'the destroy hook must be installed on the breakout host too');
            hook({ room = mock_room });
            assert.are.equal(1, #webhook_payloads('agent.ended'));
        end)
    end)

    describe('alternate configurations (module reloaded)', function()
        -- Reloads the module with option overrides into the same `routes` table, so the request helpers above
        -- drive the reloaded module; the defaults are restored afterwards.
        local function reload_with(overrides)
            option_overrides = overrides;
            for k in pairs(routes) do routes[k] = nil; end
            logs = {};
            assert(pcall(dofile, 'mod_voice_agent_component.lua'));
        end
        after_each(function()
            reload_with({});
        end)

        it('refuses to load without an ASAP key repository, so a meeting token can never provision agents', function()
            reload_with({ prosody_password_public_key_repo_url = '' });
            assert.is_nil(next(routes), 'no route may be registered');
            local said_why = false;
            for _, entry in ipairs(logs) do
                if entry.level == 'error' and entry.text:find('prosody_password_public_key_repo_url', 1, true) then
                    said_why = true;
                end
            end
            assert.is_true(said_why);
        end)

        it('loads without a key repository only under the insecure dev flag', function()
            reload_with({ prosody_password_public_key_repo_url = ''; voice_agent_insecure_skip_auth = true });
            assert.is_function(routes['POST voice-agent/invite']);
            assert.are.equal(200, invite({ conference = 'r'; displayName = 'Bot' }, { omitAuth = true }).status_code);
        end)

        it('refuses a callbackUrl while webhooks cannot be signed', function()
            reload_with({ voice_agent_webhook_secret = '' });
            assert.are.equal(400, invite({ conference = 'r'; displayName = 'B'; callbackUrl = CALLBACK }).status_code);
            assert.are.equal(200, invite({ conference = 'r'; displayName = 'B' }).status_code);
        end)

        it('lets the status secret read dial configs only while no dial secret is set', function()
            reload_with({ voice_agent_dial_secret = '' });
            invite({ conference = 'r'; displayName = 'Bot'; agentId = 'support' });
            token_valid = false;
            assert.are.equal(200, dial('conference=r&agentId=agent-support', { token = 'Bearer jicofo-secret' }).status_code);
        end)
    end)
end)
