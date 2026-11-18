-- Unit tests for the public key cache of token/util.lib.lua
-- Run with busted from resources/prosody-plugins/:
--   busted ../../tests/prosody/lua/
--
-- Stubs every Prosody dependency so no Prosody installation is needed.
-- These cover get_public_key together with set_asap_key_server: a key is fetched once per key
-- server, also when the key server is set again before each lookup.

-- ---------------------------------------------------------------------------
-- Stubs for top-level `require`d libs
-- ---------------------------------------------------------------------------

-- Installed in package.preload only while the library loads, so they do not leak into the specs that
-- run after this one in the same busted process.
local stubs = {}

stubs['util.async'] = function() return {} end
stubs['util.hex'] = function() return { to = function(s) return s end } end
stubs['util.jid'] = function() return {} end
stubs['cjson.safe'] = function() return {} end
stubs['util.paths'] = function() return { join = function(a, b) return a .. '/' .. b end } end
stubs['util.hashes'] = function() return { sha256 = function(s) return s end } end
stubs['util.timer'] = function() return { add_task = function() end } end
stubs['util.serialization'] = function() return { new = function() return tostring end } end
stubs['ssl'] = function() return {} end
stubs['util.cache'] = function()
    return {
        new = function()
            local items = {}
            return {
                get = function(_, k) return items[k] end,
                set = function(_, k, v) items[k] = v end,
            }
        end,
    }
end

-- ---------------------------------------------------------------------------
-- Key server and module stubs
-- ---------------------------------------------------------------------------

-- The URLs requested from the key server, in order.
local fetched
-- URL -> key content. A URL that is not here answers 404.
local served

local util_stub = {
    http_get_with_retry = function(url)
        table.insert(fetched, url)
        if served[url] then
            return served[url], 200
        end
        return nil, 404
    end,
    starts_with = function(str, start) return str:sub(1, #start) == start end,
}

local options = {
    app_id = 'jitsi',
    asap_key_server = 'https://keys.example.com/a',
}

local function get_option(_, key, default)
    if options[key] ~= nil then return options[key] end
    return default
end

local module_stub = {
    log = function() end,
    measure = function() return function() end end,
    get_option_string = get_option,
    get_option_number = get_option,
    get_option_boolean = get_option,
    get_option_array = get_option,
    require = function(_, name)
        if name == 'util' then return util_stub end
        return {}
    end,
}

local function load_library()
    _G.module = module_stub

    local saved = {}
    for name, loader in pairs(stubs) do
        saved[name] = { preload = package.preload[name], loaded = package.loaded[name] }
        package.preload[name] = loader
        package.loaded[name] = nil
    end

    local ok, result = pcall(dofile, 'token/util.lib.lua')

    for name, previous in pairs(saved) do
        package.preload[name] = previous.preload
        package.loaded[name] = previous.loaded
    end
    assert(ok, result)

    return result
end

-- ---------------------------------------------------------------------------
-- Tests
-- ---------------------------------------------------------------------------

describe('token/util public key cache', function()
    local KEY_SERVER_A = 'https://keys.example.com/a'
    local KEY_SERVER_B = 'https://keys.example.com/b'
    local KID = 'kid-1'

    local Util
    local token_util

    -- Util.new and clear_asap_cache call require "util.cache" at run time, so the cache stub stays
    -- installed for all the tests here and is removed after them.
    local saved_cache

    setup(function()
        saved_cache = { preload = package.preload['util.cache'], loaded = package.loaded['util.cache'] }
        Util = load_library()
        package.preload['util.cache'] = stubs['util.cache']
        package.loaded['util.cache'] = nil
    end)

    teardown(function()
        package.preload['util.cache'] = saved_cache.preload
        package.loaded['util.cache'] = saved_cache.loaded
    end)

    before_each(function()
        fetched = {}
        served = {
            [KEY_SERVER_A .. '/' .. KID .. '.pem'] = 'key from a',
            [KEY_SERVER_B .. '/' .. KID .. '.pem'] = 'key from b',
        }
        token_util = Util.new(module_stub)
        assert(token_util, 'Util.new returned nil')
    end)

    it('fetches a key once and then returns it from the cache', function()
        assert.equal('key from a', token_util:get_public_key(KID))
        assert.equal('key from a', token_util:get_public_key(KID))

        assert.same({ KEY_SERVER_A .. '/' .. KID .. '.pem' }, fetched)
    end)

    it('keeps the cached key when the same key server is set before each lookup', function()
        for _ = 1, 3 do
            token_util:set_asap_key_server(KEY_SERVER_A)
            assert.equal('key from a', token_util:get_public_key(KID))
        end

        assert.same({ KEY_SERVER_A .. '/' .. KID .. '.pem' }, fetched)
    end)

    it('keeps the cached keys when the key server alternates between lookups', function()
        for _ = 1, 3 do
            token_util:set_asap_key_server(KEY_SERVER_A)
            assert.equal('key from a', token_util:get_public_key(KID))
            token_util:set_asap_key_server(KEY_SERVER_B)
            assert.equal('key from b', token_util:get_public_key(KID))
        end

        assert.same({
            KEY_SERVER_A .. '/' .. KID .. '.pem',
            KEY_SERVER_B .. '/' .. KID .. '.pem',
        }, fetched)
    end)

    it('does not return a key that was cached from another key server', function()
        assert.equal('key from a', token_util:get_public_key(KID))

        served[KEY_SERVER_B .. '/' .. KID .. '.pem'] = nil
        token_util:set_asap_key_server(KEY_SERVER_B)

        assert.is_nil(token_util:get_public_key(KID))
    end)

    it('does not cache a failed fetch', function()
        served[KEY_SERVER_A .. '/' .. KID .. '.pem'] = nil
        assert.is_nil(token_util:get_public_key(KID))

        served[KEY_SERVER_A .. '/' .. KID .. '.pem'] = 'key from a'
        assert.equal('key from a', token_util:get_public_key(KID))

        assert.equal(2, #fetched)
    end)

    it('fetches the key again after clear_asap_cache', function()
        assert.equal('key from a', token_util:get_public_key(KID))

        token_util:clear_asap_cache()
        served[KEY_SERVER_A .. '/' .. KID .. '.pem'] = nil

        assert.is_nil(token_util:get_public_key(KID))
        assert.equal(2, #fetched)
    end)
end)
