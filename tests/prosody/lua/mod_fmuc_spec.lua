-- Unit tests for mod_fmuc.lua
-- Run with busted from resources/prosody-plugins/:
--   busted ../../tests/prosody/lua/
--
-- Stubs every Prosody dependency so no Prosody installation is needed.
-- These cover the route/remote hook on the virtual host of the vnode: a stanza that a client addresses
-- to the main prosody is dropped, and the stanzas the vnode itself sends there are routed.

-- ---------------------------------------------------------------------------
-- Stubs for top-level `require`d Prosody libs
-- ---------------------------------------------------------------------------

-- Installed in package.preload only while the module loads, so they do not leak into the specs that
-- run after this one in the same busted process (e.g. one that requires the real util.stanza).
local stubs = {}

local function empty() return {} end

stubs['util.id'] = function() return { medium = function() return 'id' end } end
stubs['util.filters'] = function()
    return { add_filter_hook = function() end, add_filter = function() end }
end
stubs['util.array'] = empty
stubs['util.set'] = empty
stubs['cjson.safe'] = empty
stubs['util.datetime'] = empty
stubs['util.cache'] = function() return { new = empty } end
stubs['util.jid'] = function()
    local function split(j)
        if not j then return nil end
        local node, host, resource = j:match('^([^@/]+)@([^/]+)/?(.*)$')
        if not node then
            host, resource = j:match('^([^/]+)/?(.*)$')
        end
        return node, host, resource ~= '' and resource or nil
    end
    return {
        split = split,
        node = function(j) return (split(j)) end,
        host = function(j) return select(2, split(j)) end,
        bare = function(j) return j and j:match('^([^/]+)') end,
    }
end
stubs['util.stanza'] = function()
    return {
        error_reply = function(_, error_type, condition, text)
            return { error_type = error_type, condition = condition, text = text }
        end,
    }
end

-- ---------------------------------------------------------------------------
-- Module stub
-- ---------------------------------------------------------------------------

local LOCAL_DOMAIN = 'v1.meet.jitsi'
local MAIN_DOMAIN = 'example.com'
local MUC_HOST = 'conference.' .. LOCAL_DOMAIN

local util_stub = {
    ends_with = function(str, ending)
        return str ~= nil and ending ~= nil and str:sub(-#ending) == ending
    end,
}

-- The route/remote handler that mod_fmuc hooks on the virtual host of the vnode.
local route_remote_fn
local route_remote_priority

local function load_module()
    route_remote_fn = nil
    route_remote_priority = nil

    local options = {
        muc_mapper_domain_base = LOCAL_DOMAIN,
        main_domain = MAIN_DOMAIN,
    }

    local function noop() end

    _G.prosody = {
        hosts = { [LOCAL_DOMAIN] = {} },
        events = { add_handler = noop },
        full_sessions = {},
    }
    _G.module = {
        host = MUC_HOST,
        log = noop,
        get_option_string = function(_, key, default) return options[key] or default end,
        get_option_boolean = function(_, key, default)
            if options[key] == nil then return default end
            return options[key]
        end,
        measure = function() return noop end,
        hook = noop,
        hook_global = noop,
        require = function(_, name)
            if name == 'util' then return util_stub end
            return {}
        end,
        context = function(_, host)
            return {
                host = host,
                hook = function(_, event, fn, priority)
                    if host == LOCAL_DOMAIN and event == 'route/remote' then
                        route_remote_fn = fn
                        route_remote_priority = priority
                    end
                end,
            }
        end,
    }

    local saved = {}
    for name, loader in pairs(stubs) do
        saved[name] = { preload = package.preload[name], loaded = package.loaded[name] }
        package.preload[name] = loader
        package.loaded[name] = nil
    end

    local ok, err = pcall(dofile, 'mod_fmuc.lua')

    for name, previous in pairs(saved) do
        package.preload[name] = previous.preload
        package.loaded[name] = previous.loaded
    end
    assert(ok, err)
    assert(route_remote_fn, "mod_fmuc did not hook 'route/remote' on " .. LOCAL_DOMAIN)
end

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

-- A session of the given type. Error replies sent to it are kept in session.sent.
local function new_session(session_type)
    local session = { type = session_type, sent = {} }
    session.send = function(stanza) table.insert(session.sent, stanza) end
    return session
end

local function route(origin, name, to, stanza_type)
    local to_host = to:match('@([^/]+)') or to:match('^([^/]+)')
    return route_remote_fn({
        origin = origin,
        stanza = { name = name, attr = { from = 'visitor@' .. LOCAL_DOMAIN .. '/res', to = to, type = stanza_type } },
        from_host = LOCAL_DOMAIN,
        to_host = to_host,
    })
end

-- ---------------------------------------------------------------------------
-- Tests
-- ---------------------------------------------------------------------------

describe('mod_fmuc route/remote on the vnode virtual host', function()
    before_each(load_module)

    it('runs before mod_s2s routes the stanza', function()
        assert.is_true(route_remote_priority > -1)
    end)

    it('drops a presence from a client to the main muc', function()
        local session = new_session('c2s')

        assert.is_true(route(session, 'presence', 'room@conference.' .. MAIN_DOMAIN .. '/nick'))
        assert.are.equal('not-allowed', session.sent[1].condition)
    end)

    it('drops a presence from a client to a tenant muc domain of the main prosody', function()
        local session = new_session('c2s')

        assert.is_true(route(session, 'presence', 'room@conference.tenant.' .. MAIN_DOMAIN .. '/nick'))
        assert.are.equal('not-allowed', session.sent[1].condition)
    end)

    it('drops a message and an iq from a client to the main domain', function()
        local session = new_session('c2s')

        assert.is_true(route(session, 'message', 'user@' .. MAIN_DOMAIN .. '/res'))
        assert.is_true(route(session, 'iq', 'visitors.' .. MAIN_DOMAIN, 'set'))
        assert.are.equal(2, #session.sent)
    end)

    it('does not answer an error or a result from a client', function()
        local session = new_session('c2s')

        assert.is_true(route(session, 'presence', 'room@conference.' .. MAIN_DOMAIN .. '/nick', 'error'))
        assert.is_true(route(session, 'iq', 'focus@auth.' .. MAIN_DOMAIN .. '/focus', 'result'))
        assert.are.equal(0, #session.sent)
    end)

    it('routes a stanza that the vnode sends to the main prosody', function()
        local component = new_session('component')

        assert.is_nil(route(component, 'iq', 'visitors.' .. MAIN_DOMAIN, 'set'))
        assert.are.equal(0, #component.sent)
    end)

    it('routes a stanza from a client to a domain that only ends like the main domain', function()
        local session = new_session('c2s')

        assert.is_nil(route(session, 'presence', 'room@conference.not' .. MAIN_DOMAIN .. '/nick'))
        assert.are.equal(0, #session.sent)
    end)
end)
