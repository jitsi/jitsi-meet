-- Unit tests for mod_voice_agent_component.lua
-- Run with busted from resources/prosody-plugins/:
--   busted ../../tests/prosody/lua/
--
-- Stubs every Prosody dependency so no Prosody installation is needed. These focus on the
-- security-relevant validation at the provisioning boundary: ASAP auth, agentId namespacing (the
-- reserved "agent-" prefix that makes an agent id un-collidable with a real 8-hex endpoint id),
-- prototype-pollution key rejection, string-map bounds, jicofo-only secret segregation — and the
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

local util_stub = {
    async_handler_wrapper = function(event, handler) return handler(event); end,
    get_room_from_jid = function(jid)
        if jid == 'missing' then return nil; end
        return mock_room;
    end,
    is_healthcheck_room = function(_) return false; end,
    process_host_module = function(_host, cb)
        cb({ hook = function(_, name, fn) host_hooks[name] = fn; end; fire_event = function(_, name)
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

_G.module = {
    host = 'voiceagent.localhost',
    log = function() end,
    get_option_string = function(_, key, default)
        if key == 'muc_component' then return 'conference.localhost'; end
        if key == 'voice_agent_webhook_secret' then return 'shh'; end
        if key == 'voice_agent_status_secret' then return 'jicofo-secret'; end
        return default;
    end,
    get_option_number = function(_, _key, default) return default; end,
    get_option_boolean = function(_, _key, default) return default; end,
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
                         'GET voice-agent/get', 'POST voice-agent/status' }) do
    assert(routes[route], route .. ' route not registered');
end

-- ---------------------------------------------------------------------------
-- Test helpers
-- ---------------------------------------------------------------------------

local function fresh_room()
    return { jid = 'room1@conference.localhost', jitsiMetadata = {}, _data = {} };
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

local function invite(payload, opts) return post('POST voice-agent/invite', payload, opts); end
local function dismiss(payload) return post('POST voice-agent/dismiss', payload); end
local function status(payload, opts) return post('POST voice-agent/status', payload, opts); end

local function get(query)
    return routes['GET voice-agent/get']({
        request = { headers = { authorization = 'Bearer t' }; url = { query = query } } });
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
        for i = #encoded, 1, -1 do encoded[i] = nil; end
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

    describe('string-map validation (urlParams / httpHeaders)', function()
        it('rejects a non-string map value', function()
            assert.are.equal(400,
                invite({ conference = 'r'; displayName = 'B'; urlParams = { k = 5 } }).status_code);
        end)

        it('rejects too many entries', function()
            local big = {};
            for i = 1, 17 do big['k' .. i] = 'v'; end
            assert.are.equal(400, invite({ conference = 'r'; displayName = 'B'; httpHeaders = big }).status_code);
        end)

        it('rejects a value with control characters (CRLF header injection)', function()
            assert.are.equal(400,
                invite({ conference = 'r'; displayName = 'B';
                    httpHeaders = { X = 'a\r\nX-Injected: 1' } }).status_code);
        end)

        it('rejects an over-long key', function()
            assert.are.equal(400,
                invite({ conference = 'r'; displayName = 'B';
                    httpHeaders = { [string.rep('k', 129)] = 'v' } }).status_code);
        end)

        it('rejects httpHeaders that set a reserved X-Agent-* header (endpoint bypass)', function()
            assert.are.equal(400,
                invite({ conference = 'r'; displayName = 'B';
                    httpHeaders = { ['X-Agent-Endpoint'] = 'ws://169.254.169.254/' } }).status_code);
        end)
    end)

    describe('secret segregation', function()
        it('keeps httpHeaders out of the client-facing entry and on the jicofo-only side', function()
            invite({
                conference = 'r';
                displayName = 'Bot';
                agentId = 'support';
                httpHeaders = { Authorization = 'Bearer customer-secret' }
            });
            local client_entry = mock_room.jitsiMetadata.agents['agent-support'];
            assert.is_nil(client_entry.httpHeaders, 'client-facing entry must not carry httpHeaders');
            assert.are.equal('Bearer customer-secret',
                mock_room._data.voice_agents['agent-support'].httpHeaders.Authorization);
        end)

        it('maps the endpoint.{url,authorization} convenience onto jicofo-only X-Agent headers', function()
            invite({
                conference = 'r';
                displayName = 'Bot';
                agentId = 'support';
                endpoint = { url = 'wss://agents.example.com/s'; authorization = 'Bearer k' }
            });
            local headers = mock_room._data.voice_agents['agent-support'].httpHeaders;
            assert.are.equal('wss://agents.example.com/s', headers['X-Agent-Endpoint']);
            assert.are.equal('Bearer k', headers['X-Agent-Authorization']);
            assert.is_nil(mock_room.jitsiMetadata.agents['agent-support'].httpHeaders);
        end)

        it('rejects a non-wss endpoint.url', function()
            assert.are.equal(400, invite({
                conference = 'r'; displayName = 'B'; endpoint = { url = 'http://evil/s' }
            }).status_code);
        end)
    end)

    describe('customParameters', function()
        it('is validated like the other string maps', function()
            assert.are.equal(400,
                invite({ conference = 'r'; displayName = 'B'; customParameters = { k = 5 } }).status_code);
        end)

        it('is stored jicofo-only and merged into the dial urlParams (explicit urlParams win)', function()
            invite({ conference = 'r'; displayName = 'B'; agentId = 'support';
                urlParams = { region = 'us' }; customParameters = { campaign = '42'; region = 'ignored' } });
            assert.is_nil(mock_room.jitsiMetadata.agents['agent-support'].customParameters);
            assert.are.equal('42', mock_room._data.voice_agents['agent-support'].customParameters.campaign);

            local extra = {};
            host_hooks['jitsi-room-metadata-admin-extra']({ room = mock_room; extra = extra });
            assert.are.equal('42', extra.agents['agent-support'].urlParams.campaign);
            assert.are.equal('us', extra.agents['agent-support'].urlParams.region);
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
end)
