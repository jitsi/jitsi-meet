-- Unit tests for mod_short_lived_token.lua
-- Run with busted from resources/prosody-plugins/:
--   busted ../../tests/prosody/lua/mod_short_lived_token_spec.lua
--
-- Stubs every Prosody dependency so no Prosody installation is needed.
-- Uses a controllable jwt stub to capture payload fields without requiring
-- the openssl library.

-- ---------------------------------------------------------------------------
-- Package preloads — Prosody dependencies
-- ---------------------------------------------------------------------------

package.preload['util.jid'] = function()
    local function split(j)
        if not j then return nil, nil, nil end
        local node, host, resource
        local at = j:find('@')
        if at then
            local slash = j:find('/', at + 1)
            node = j:sub(1, at - 1)
            if slash then
                host     = j:sub(at + 1, slash - 1)
                resource = j:sub(slash + 1)
            else
                host = j:sub(at + 1)
            end
        else
            local slash = j:find('/')
            if slash then
                host     = j:sub(1, slash - 1)
                resource = j:sub(slash + 1)
            else
                host = j
            end
        end
        node     = (node     and #node     > 0) and node     or nil
        host     = (host     and #host     > 0) and host     or nil
        resource = (resource and #resource > 0) and resource or nil
        return node, host, resource
    end
    return {
        split    = split,
        node     = function(j) local n = split(j); return n end,
        resource = function(j) local _, _, r = split(j); return r end,
        bare     = function(j)
            local n, h = split(j)
            if n then return n .. '@' .. (h or '') end
            return h
        end,
    }
end

package.preload['util.stanza'] = function()
    return {
        error_reply = function(stanza, etype, condition)
            return { is_error_reply = true, type = etype, condition = condition, original = stanza }
        end,
    }
end

package.preload['prosody.util.throttle'] = function()
    return { create = function() return {} end }
end

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

-- Single-pass iterator over a list — mimics Prosody's requested_credentials.
local function iter(t)
    local i = 0
    return function()
        i = i + 1
        return t[i]
    end
end

-- Minimal presence stanza stub.
local function make_presence(nick, email)
    return {
        get_child_text = function(_, tag, _ns)
            if tag == 'nick'  then return nick  end
            if tag == 'email' then return email end
            return nil
        end,
    }
end

-- Minimal occupant stub.
local function make_occupant(full_jid, nick, presence_nick, presence_email)
    local p = make_presence(presence_nick, presence_email)
    return {
        nick = nick or ('conference.example.com/' .. (presence_nick or 'Alice')),
        get_presence = function(_, _jid) return p end,
    }
end

-- Minimal room stub.
local function make_room(jid, meeting_id, occupant_map)
    return {
        jid   = jid,
        _data = { meetingId = meeting_id },
        get_occupant_by_real_jid = function(_, real_jid)
            if occupant_map then return occupant_map[real_jid] end
            return nil
        end,
    }
end

-- ---------------------------------------------------------------------------
-- Controllable JWT stub.
-- Exposes captured_payload and captured_key so tests can inspect them.
-- Set .fail = true to simulate an encode error.
-- ---------------------------------------------------------------------------
local mock_jwt = {
    fail            = false,
    captured_payload = nil,
    captured_key     = nil,
    encode = function(self, payload, key, _alg, _headers)
        self.captured_payload = payload
        self.captured_key     = key
        if self.fail then
            return nil, 'mock-encode-error'
        end
        return 'mock.jwt.token', nil
    end,
}
-- Make encode callable without explicit self (module calls jwt.encode(...))
setmetatable(mock_jwt, {
    __index = mock_jwt,
})

-- ---------------------------------------------------------------------------
-- Module stub factory.
-- Returns a fresh (stub, hooks, log_calls) triple.
-- ---------------------------------------------------------------------------
local function make_module_stub(options_override)
    local hooks     = {}
    local log_calls = {}

    local opts = options_override or {
        issuer             = 'test-issuer',
        accepted_audiences = { 'file-sharing' },
        key_path           = '/fake/key.pem',
        key_id             = 'kid-1',
        ttl_seconds        = 30,
    }

    local stub = {
        host       = 'test.example.com',
        set_global = function() end,
        log = function(_, level, fmt, ...)
            -- fmt may contain no format specifiers; guard with pcall
            local ok, msg = pcall(string.format, fmt, ...)
            log_calls[#log_calls + 1] = {
                level = level,
                msg   = ok and msg or fmt,
            }
        end,
        hook = function(_, name, handler)
            hooks[name] = handler
        end,
        get_option = function(_, key)
            if key == 'short_lived_token' then return opts end
            return nil
        end,
        get_option_string = function(_, key, default)
            if key == 'region_name' then return 'us-east-1' end
            if key == 'main_muc'    then return 'conference.test.example.com' end
            return default
        end,
        require = function(_, name)
            if name == 'luajwtjitsi' then
                -- Return a table whose encode method delegates to mock_jwt
                return {
                    encode = function(payload, key, alg, headers)
                        return mock_jwt:encode(payload, key, alg, headers)
                    end,
                }
            end
            if name == 'util' then
                return {
                    is_vpaas            = function() return false end,
                    process_host_module = function() end,
                    table_find          = function(t, v)
                        for _, x in ipairs(t) do if x == v then return true end end
                        return nil
                    end,
                }
            end
            error('unexpected module:require("' .. name .. '")')
        end,
    }

    return stub, hooks, log_calls
end

-- Patch io.open so key-file read at load-time returns a fake key string.
local real_io_open = io.open
local function patch_io()
    io.open = function(path, mode)
        if path == '/fake/key.pem' and mode == 'r' then
            return {
                read  = function(_, _fmt) return 'FAKE-PRIVATE-KEY' end,
                close = function() end,
            }
        end
        return real_io_open(path, mode)
    end
end
local function restore_io() io.open = real_io_open end

-- Load the module under test into _G.
local function load_module(module_stub)
    mock_jwt.fail             = false
    mock_jwt.captured_payload = nil
    mock_jwt.captured_key     = nil
    _G.module  = module_stub
    _G.prosody = { hosts = {} }
    _G.extract_subdomain              = function(node) return nil, node, nil end
    _G.get_room_by_name_and_subdomain = function() return nil end
    patch_io()
    local ok, err = pcall(dofile, 'mod_short_lived_token.lua')
    restore_io()
    return ok, err
end

-- Convenience: load + return hooks (asserts successful load).
local function load_and_get_hooks(opts_override)
    local stub, hooks, log_calls = make_module_stub(opts_override)
    local ok, err = load_module(stub)
    assert.is_true(ok, tostring(err))
    return hooks, log_calls, stub
end

-- ---------------------------------------------------------------------------
-- Tests
-- ---------------------------------------------------------------------------

describe('mod_short_lived_token', function()

    -- -----------------------------------------------------------------------
    -- Config validation
    -- -----------------------------------------------------------------------
    describe('config validation', function()

        it('loads cleanly with all required options present', function()
            local _, log_calls = load_and_get_hooks()
            local errors = {}
            for _, e in ipairs(log_calls) do
                if e.level == 'error' then errors[#errors + 1] = e.msg end
            end
            assert.equal(0, #errors, 'unexpected error: ' .. table.concat(errors, '; '))
        end)

        for _, missing in ipairs({ 'issuer', 'accepted_audiences', 'key_path', 'key_id', 'ttl_seconds' }) do
            it('logs error and skips hook when ' .. missing .. ' is absent', function()
                local opts = {
                    issuer             = 'test-issuer',
                    accepted_audiences = { 'file-sharing' },
                    key_path           = '/fake/key.pem',
                    key_id             = 'kid-1',
                    ttl_seconds        = 30,
                }
                opts[missing] = nil

                local stub, hooks, log_calls = make_module_stub(opts)
                local ok, err = load_module(stub)
                assert.is_true(ok, tostring(err))
                assert.is_nil(hooks['external_service/credentials'],
                    'hook must not register when config is incomplete')

                local found_error = false
                for _, e in ipairs(log_calls) do
                    if e.level == 'error' then found_error = true end
                end
                assert.is_true(found_error, 'expected an error log entry')
            end)
        end

        it('logs error and does not register hook when main_muc is absent', function()
            local stub, hooks, log_calls = make_module_stub()
            stub.get_option_string = function(_, key, default)
                if key == 'region_name' then return 'us-east-1' end
                if key == 'main_muc'    then return nil end
                return default
            end
            local ok = load_module(stub)
            assert.is_true(ok)
            assert.is_nil(hooks['external_service/credentials'])
            local found_error = false
            for _, e in ipairs(log_calls) do
                if e.level == 'error' then found_error = true end
            end
            assert.is_true(found_error)
        end)

    end) -- config validation

    -- -----------------------------------------------------------------------
    -- external_service/credentials handler — error cases
    -- -----------------------------------------------------------------------
    describe('external_service/credentials handler', function()

        local hooks

        before_each(function()
            hooks = load_and_get_hooks()
        end)

        it('sends not-allowed when room is not found', function()
            _G.get_room_by_name_and_subdomain = function() return nil end
            local error_sent
            local session = {
                full_jid               = 'user@example.com/res',
                jitsi_web_query_room   = 'missing',
                jitsi_web_query_prefix = '',
                send = function(reply) error_sent = reply end,
            }
            hooks['external_service/credentials']({
                requested_credentials = iter({ 'short-lived-token:file-sharing:0' }),
                services              = { push = function() end },
                origin                = session,
                stanza                = { id = 'iq1' },
            })
            assert.is_not_nil(error_sent)
            assert.equal('not-allowed', error_sent.condition)
        end)

        it('sends not-allowed when session is not an occupant', function()
            local room = make_room('r@conference.example.com', 'mid', {})
            _G.get_room_by_name_and_subdomain = function() return room end
            local error_sent
            local session = {
                full_jid               = 'outsider@example.com/res',
                jitsi_web_query_room   = 'r',
                jitsi_web_query_prefix = '',
                send = function(reply) error_sent = reply end,
            }
            hooks['external_service/credentials']({
                requested_credentials = iter({ 'short-lived-token:file-sharing:0' }),
                services              = { push = function() end },
                origin                = session,
                stanza                = { id = 'iq2' },
            })
            assert.is_not_nil(error_sent)
            assert.equal('not-allowed', error_sent.condition)
        end)

        it('does not push service when credential key is not in accepted map', function()
            local occupant = make_occupant('user@example.com/res', nil, 'Alice', nil)
            local room     = make_room('r@conference.example.com', 'mid',
                { ['user@example.com/res'] = occupant })
            _G.get_room_by_name_and_subdomain = function() return room end
            local pushed = {}
            local services = { push = function(_, item) pushed[#pushed + 1] = item end }
            hooks['external_service/credentials']({
                requested_credentials = iter({ 'short-lived-token:unknown-audience:0' }),
                services              = services,
                origin = { full_jid = 'user@example.com/res', jitsi_web_query_room = 'r',
                           jitsi_web_query_prefix = '' },
                stanza = {},
            })
            assert.equal(0, #pushed)
        end)

        -- -------------------------------------------------------------------
        -- Service entry shape
        -- -------------------------------------------------------------------
        describe('valid request service entry', function()

            local pushed_item

            before_each(function()
                local occupant = make_occupant('user@example.com/res', nil, 'Alice', nil)
                local room     = make_room('r@conference.example.com', 'meet-123',
                    { ['user@example.com/res'] = occupant })
                _G.get_room_by_name_and_subdomain = function() return room end
                local items = {}
                local services = { push = function(_, item) items[#items + 1] = item end }
                hooks['external_service/credentials']({
                    requested_credentials = iter({ 'short-lived-token:file-sharing:0' }),
                    services              = services,
                    origin = { full_jid = 'user@example.com/res', jitsi_web_query_room = 'r',
                               jitsi_web_query_prefix = '' },
                    stanza = {},
                })
                pushed_item = items[1]
            end)

            it('type is short-lived-token',  function() assert.equal('short-lived-token', pushed_item.type)      end)
            it('host is audience value',     function() assert.equal('file-sharing',      pushed_item.host)      end)
            it('username is token',          function() assert.equal('token',             pushed_item.username)  end)
            it('transport is https',         function() assert.equal('https',             pushed_item.transport) end)
            it('port is 443',                function() assert.equal(443,                 pushed_item.port)      end)
            it('restricted is true',         function() assert.is_true(pushed_item.restricted)                  end)
            it('expires = now + ttl',        function()
                local now = os.time()
                assert.is_true(pushed_item.expires >= now + 29 and pushed_item.expires <= now + 31)
            end)
            it('password is non-empty string', function()
                assert.is_string(pushed_item.password)
                assert.is_true(#pushed_item.password > 0)
            end)
        end)

        it('multiple audiences produce one service entry each', function()
            local hooks2 = load_and_get_hooks({
                issuer             = 'iss',
                accepted_audiences = { 'aud-a', 'aud-b' },
                key_path           = '/fake/key.pem',
                key_id             = 'kid',
                ttl_seconds        = 30,
            })
            local occupant = make_occupant('user@example.com/res', nil, 'Bob', nil)
            local room     = make_room('r@conference.example.com', 'mid',
                { ['user@example.com/res'] = occupant })
            _G.get_room_by_name_and_subdomain = function() return room end
            local items = {}
            local services = { push = function(_, item) items[#items + 1] = item end }
            hooks2['external_service/credentials']({
                requested_credentials = iter({
                    'short-lived-token:aud-a:0',
                    'short-lived-token:aud-b:0',
                }),
                services = services,
                origin = { full_jid = 'user@example.com/res', jitsi_web_query_room = 'r',
                           jitsi_web_query_prefix = '' },
                stanza = {},
            })
            assert.equal(2, #items)
            assert.equal('aud-a', items[1].host)
            assert.equal('aud-b', items[2].host)
        end)

    end) -- handler

    -- -----------------------------------------------------------------------
    -- generateToken — JWT payload claims
    -- Tested by capturing mock_jwt.captured_payload after invoking the handler.
    -- -----------------------------------------------------------------------
    describe('generateToken payload', function()

        -- Invoke handler with given session fields; returns captured payload.
        -- Optional extract_subdomain_fn overrides the global after module load.
        local function get_payload(session_fields, room_override, extract_subdomain_fn)
            hooks = load_and_get_hooks()
            mock_jwt.captured_payload = nil

            -- Apply extract_subdomain override AFTER load_module (which resets it).
            if extract_subdomain_fn then
                _G.extract_subdomain = extract_subdomain_fn
            end

            local full_jid  = session_fields.full_jid or 'user@example.com/res'
            local pres_nick  = session_fields._presence_nick  or 'Alice'
            local pres_email = session_fields._presence_email or nil

            local occupant = make_occupant(full_jid, nil, pres_nick, pres_email)
            local room = room_override or make_room(
                'myroom@conference.example.com', 'meeting-xyz',
                { [full_jid] = occupant }
            )
            _G.get_room_by_name_and_subdomain = function() return room end

            local session = {}
            for k, v in pairs(session_fields) do
                if k:sub(1, 1) ~= '_' then session[k] = v end
            end

            local items = {}
            local services = { push = function(_, item) items[#items + 1] = item end }
            hooks['external_service/credentials']({
                requested_credentials = iter({ 'short-lived-token:file-sharing:0' }),
                services              = services,
                origin                = session,
                stanza                = {},
            })
            return mock_jwt.captured_payload
        end

        local base_session = {
            full_jid               = 'user@example.com/res',
            jitsi_web_query_room   = 'myroom',
            jitsi_web_query_prefix = '',
        }

        it('iss is set to configured issuer', function()
            local p = get_payload(base_session)
            assert.equal('test-issuer', p.iss)
        end)

        it('aud is set to requested audience', function()
            local p = get_payload(base_session)
            assert.equal('file-sharing', p.aud)
        end)

        it('exp is approximately now + ttl_seconds', function()
            local before = os.time()
            local p = get_payload(base_session)
            local after = os.time()
            assert.is_true(p.exp >= before + 30 and p.exp <= after + 30)
        end)

        it('nbf is approximately now', function()
            local before = os.time()
            local p = get_payload(base_session)
            local after = os.time()
            assert.is_true(p.nbf >= before - 1 and p.nbf <= after)
        end)

        it('sub defaults to module.host when jitsi_web_query_prefix is nil', function()
            local p = get_payload({
                full_jid               = 'user@example.com/res',
                jitsi_web_query_room   = 'myroom',
                jitsi_web_query_prefix = nil,
            })
            assert.equal('test.example.com', p.sub)
        end)

        it('sub defaults to module.host when jitsi_web_query_prefix is empty string', function()
            local p = get_payload(base_session)
            assert.equal('test.example.com', p.sub)
        end)

        it('sub is jitsi_web_query_prefix when non-empty', function()
            local p = get_payload({
                full_jid               = 'user@example.com/res',
                jitsi_web_query_room   = 'myroom',
                jitsi_web_query_prefix = 'mysubdomain',
            })
            assert.equal('mysubdomain', p.sub)
        end)

        it('context.user taken from session when jitsi_meet_context_user present', function()
            local cu = { id = 'uid-99', name = 'Session User', email = 'su@example.com' }
            local p = get_payload({
                full_jid                = 'user@example.com/res',
                jitsi_web_query_room    = 'myroom',
                jitsi_web_query_prefix  = '',
                jitsi_meet_context_user = cu,
            })
            assert.same(cu, p.context.user)
        end)

        it('context.user built from presence when jitsi_meet_context_user absent', function()
            local p = get_payload({
                full_jid               = 'user@example.com/res',
                jitsi_web_query_room   = 'myroom',
                jitsi_web_query_prefix = '',
                _presence_nick         = 'PresenceNick',
                _presence_email        = 'presence@example.com',
            })
            assert.equal('PresenceNick',         p.context.user.name)
            assert.equal('presence@example.com', p.context.user.email)
            assert.equal('user@example.com/res', p.context.user.id)
        end)

        it('context.group uses jitsi_meet_context_group when present', function()
            local p = get_payload({
                full_jid                            = 'user@example.com/res',
                jitsi_web_query_room                = 'myroom',
                jitsi_web_query_prefix              = '',
                jitsi_meet_context_group            = 'group-primary',
                granted_jitsi_meet_context_group_id = 'group-fallback',
            })
            assert.equal('group-primary', p.context.group)
        end)

        it('context.group falls back to granted_jitsi_meet_context_group_id', function()
            local p = get_payload({
                full_jid                            = 'user@example.com/res',
                jitsi_web_query_room                = 'myroom',
                jitsi_web_query_prefix              = '',
                jitsi_meet_context_group            = nil,
                granted_jitsi_meet_context_group_id = 'group-fallback',
            })
            assert.equal('group-fallback', p.context.group)
        end)

        it('meeting_id taken from room._data.meetingId', function()
            local p = get_payload(base_session)
            assert.equal('meeting-xyz', p.meeting_id)
        end)

        it('backend_region taken from region_name config', function()
            local p = get_payload(base_session)
            assert.equal('us-east-1', p.backend_region)
        end)

        it('user_region propagated from session', function()
            local p = get_payload({
                full_jid               = 'user@example.com/res',
                jitsi_web_query_room   = 'myroom',
                jitsi_web_query_prefix = '',
                user_region            = 'eu-west-1',
            })
            assert.equal('eu-west-1', p.user_region)
        end)

        it('customer_id uses extracted subdomain customer_id when present', function()
            local p = get_payload(base_session, nil, function(_node)
                return 'vpaas-magic-cookie-abc123', 'myroom', 'abc123'
            end)
            assert.equal('abc123', p.customer_id)
        end)

        it('customer_id falls back to group when extract_subdomain returns no customer_id', function()
            local p = get_payload({
                full_jid                 = 'user@example.com/res',
                jitsi_web_query_room     = 'myroom',
                jitsi_web_query_prefix   = '',
                jitsi_meet_context_group = 'my-group',
            }, nil, function(node) return nil, node, nil end)
            assert.equal('my-group', p.customer_id)
        end)

        it('granted_from set from session.granted_jitsi_meet_context_user_id', function()
            local p = get_payload({
                full_jid                              = 'user@example.com/res',
                jitsi_web_query_room                  = 'myroom',
                jitsi_web_query_prefix                = '',
                granted_jitsi_meet_context_user_id    = 'granter-uid',
            })
            assert.equal('granter-uid', p.granted_from)
        end)

        it('key passed to jwt.encode is the key read from key_path', function()
            get_payload(base_session)
            assert.equal('FAKE-PRIVATE-KEY', mock_jwt.captured_key)
        end)

        -- -------------------------------------------------------------------
        -- encode error path
        -- -------------------------------------------------------------------
        it('password is empty string when jwt.encode fails', function()
            local stub, hooks2, log_calls = make_module_stub()
            load_module(stub)
            mock_jwt.fail = true

            local occupant = make_occupant('user@example.com/res', nil, 'Alice', nil)
            local room     = make_room('r@conference.example.com', 'mid',
                { ['user@example.com/res'] = occupant })
            _G.get_room_by_name_and_subdomain = function() return room end

            local items = {}
            local services = { push = function(_, item) items[#items + 1] = item end }
            hooks2['external_service/credentials']({
                requested_credentials = iter({ 'short-lived-token:file-sharing:0' }),
                services              = services,
                origin = { full_jid = 'user@example.com/res', jitsi_web_query_room = 'r',
                           jitsi_web_query_prefix = '' },
                stanza = {},
            })
            mock_jwt.fail = false

            assert.equal(1, #items, 'service entry still pushed')
            assert.equal('', items[1].password, 'password empty on encode error')

            local found_error = false
            for _, e in ipairs(log_calls) do
                if e.level == 'error' then found_error = true end
            end
            assert.is_true(found_error, 'error logged on encode failure')
        end)

    end) -- generateToken payload

end) -- mod_short_lived_token
