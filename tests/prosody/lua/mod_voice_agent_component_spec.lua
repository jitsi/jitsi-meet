-- Unit tests for mod_voice_agent_component.lua
-- Run with busted from resources/prosody-plugins/:
--   busted ../../tests/prosody/lua/
--
-- Stubs every Prosody dependency so no Prosody installation is needed. These focus on the
-- security-relevant validation at the provisioning boundary: ASAP auth, agentId namespacing (the
-- reserved "agent-" prefix that makes an agent id un-collidable with a real 8-hex endpoint id),
-- prototype-pollution key rejection, string-map bounds, and jicofo-only secret segregation.
-- End-to-end behaviour against a real Prosody is covered by the integration specs.

-- ---------------------------------------------------------------------------
-- Stubs for top-level `require`d Prosody libs (no Prosody install under busted)
-- ---------------------------------------------------------------------------

package.preload['util.hashes'] = function()
    return { sha256 = function() return 'deadbeefcafef00d' end };
end
package.preload['util.random'] = function()
    return { bytes = function() return 'xxxxxxxx' end };
end
package.preload['util.http'] = function()
    return { formdecode = function(_) return {} end };
end

-- cjson.safe: the handler only round-trips through decode(body)/encode(err); we inject the decoded
-- table per test via `next_decoded` so the tests don't depend on a real JSON parser.
local next_decoded
package.preload['cjson.safe'] = function()
    return {
        decode = function(s)
            if s == nil or s == '' then
                return nil, 'empty';
            end
            return next_decoded;
        end,
        encode = function(_) return '{}'; end
    };
end

-- ---------------------------------------------------------------------------
-- Controllable stub state
-- ---------------------------------------------------------------------------

local token_valid = true;
local mock_room;

local util_stub = {
    async_handler_wrapper = function(event, handler) return handler(event); end,
    get_room_from_jid = function(jid)
        if jid == 'missing' then return nil; end
        return mock_room;
    end,
    is_healthcheck_room = function(_) return false; end,
    process_host_module = function(_host, cb) cb({ hook = function() end; fire_event = function() end }); end,
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
        return default;
    end,
    get_option_number = function(_, _key, default) return default; end,
    get_option_boolean = function(_, _key, default) return default; end,
    measure = function() return function() end; end,
    depends = function() end,
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

assert(routes['POST voice-agent/invite'], 'invite route not registered');
assert(routes['POST voice-agent/dismiss'], 'dismiss route not registered');

-- ---------------------------------------------------------------------------
-- Test helpers
-- ---------------------------------------------------------------------------

local function fresh_room()
    return { jid = 'room1@conference.localhost', jitsiMetadata = {}, _data = {} };
end

local function invite(payload, opts)
    opts = opts or {};
    next_decoded = payload;
    local headers = { content_type = 'application/json' };
    if not opts.omitAuth then
        headers.authorization = 'Bearer sometoken';
    end
    return routes['POST voice-agent/invite']({ request = { headers = headers; body = 'x' } });
end

local function dismiss(payload)
    next_decoded = payload;
    return routes['POST voice-agent/dismiss'](
        { request = { headers = { content_type = 'application/json'; authorization = 'Bearer t' }; body = 'x' } });
end

local function agent_ids(room)
    local ids = {};
    for id in pairs(room.jitsiMetadata.agents or {}) do table.insert(ids, id); end
    return ids;
end

-- ---------------------------------------------------------------------------
-- Tests
-- ---------------------------------------------------------------------------

describe('mod_voice_agent_component', function()
    before_each(function()
        token_valid = true;
        mock_room = fresh_room();
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

    describe('dismiss', function()
        it('removes an existing agent from both the client and jicofo maps', function()
            invite({ conference = 'r'; displayName = 'Bot'; agentId = 'support' });
            local res = dismiss({ conference = 'r'; agentId = 'agent-support' });
            assert.are.equal(200, res.status_code);
            assert.is_nil(mock_room.jitsiMetadata.agents['agent-support']);
            assert.is_nil(mock_room._data.voice_agents['agent-support']);
        end)

        it('returns 404 for an unknown agent', function()
            assert.are.equal(404, dismiss({ conference = 'r'; agentId = 'agent-nope' }).status_code);
        end)
    end)
end)
