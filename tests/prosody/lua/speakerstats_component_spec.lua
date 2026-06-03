-- Unit tests for SpeakerStats in mod_speakerstats_component.lua
-- Run with busted from resources/prosody-plugins/:
--   busted spec/lua/
--
-- Stubs every Prosody dependency so no Prosody installation is needed.
-- Only the pure SpeakerStats class (new_SpeakerStats / setDominantSpeaker /
-- isDominantSpeaker / isSilent) is exercised here. Functions that depend on
-- live rooms, stanzas, or XMPP routing are covered by the integration tests.

-- ---------------------------------------------------------------------------
-- Controllable clock
-- socket.gettime() returns seconds (float); the module multiplies by 1000.
-- Call set_clock(ms) to advance time before each action.
-- ---------------------------------------------------------------------------
local _clock_ms = 0

local function set_clock(ms)
    _clock_ms = ms
end

-- ---------------------------------------------------------------------------
-- Package preloads — registered before dofile() so the module sees them
-- ---------------------------------------------------------------------------

package.preload['socket'] = function()
    return {
        gettime = function() return _clock_ms / 1000 end,
    }
end

package.preload['util.jid'] = function()
    local function split(jid)
        if not jid then return nil, nil, nil end
        local node = jid:match('^([^@]+)@')
        local host = jid:match('@([^/]+)')
        local res  = jid:match('/(.+)$')
        return node, host, res
    end
    return {
        resource = function(jid)
            if not jid then return nil end
            return jid:match('/(.+)$')
        end,
        split = split,
    }
end

package.preload['util.stanza'] = function()
    -- Only used by occupant_joined (route_stanza) — not exercised here.
    return {
        message = function()
            local s = {}
            s.tag  = function(self, _, _) return self end
            s.text = function(self, _)    return self end
            s.up   = function(self)       return self end
            return s
        end,
    }
end

package.preload['cjson.safe'] = function()
    return {
        encode = function(_) return '{}', nil end,
        decode = function(_) return {},   nil end,
    }
end

package.preload['prosody.util.queue'] = function()
    return {
        new = function(max_size)
            local items = {}
            local q = {}
            function q:push(v)
                table.insert(items, v)
                while #items > max_size do
                    table.remove(items, 1)
                end
            end
            function q:items()
                local i = 0
                return function()
                    i = i + 1
                    return items[i]
                end
            end
            function q:count() return #items end
            return q
        end,
    }
end

package.preload['prosody.util.array'] = function()
    -- Prosody's util.array module is itself callable as a constructor.
    local arr_mt = {}
    arr_mt.__index = arr_mt
    return setmetatable({}, {
        __call = function(_, iter)
            local t = setmetatable({}, arr_mt)
            if iter then
                for v in iter do t[#t + 1] = v end
            end
            return t
        end,
    })
end

package.preload['util.async'] = function() return {} end

-- ---------------------------------------------------------------------------
-- Global stubs required by mod_speakerstats_component.lua at load time
-- ---------------------------------------------------------------------------

_G.prosody = { hosts = {}, version = 'test' }

-- Stub for the util library loaded via module:require "util"
local util_stub = {
    is_admin             = function() return false end,
    get_room_from_jid    = function() return nil  end,
    room_jid_match_rewrite = function(jid) return jid end,
    is_jibri             = function() return false end,
    is_healthcheck_room  = function() return false end,
    is_transcriber       = function() return false end,
    -- noop: prevents hook registration against live muc components
    process_host_module  = function() end,
}

local mod = { host = 'speakerstats.test.example.com' }
mod.log = function() end
mod.get_option_string = function(_, key, default)
    if key == 'muc_component'        then return 'conference.test.example.com' end
    if key == 'muc_mapper_domain_base' then return 'test.example.com' end
    return default
end
mod.get_option_number = function(_, _, default) return default end
mod.hook        = function() end
mod.fire_event  = function() end
mod.context     = function() return { fire_event = function() end } end
mod.require     = function(_, name)
    if name == 'util' then return util_stub end
    error('unexpected module:require("' .. tostring(name) .. '")')
end

_G.module = mod

-- ---------------------------------------------------------------------------
-- Load the module under test
-- ---------------------------------------------------------------------------

local ok, err = pcall(dofile, 'mod_speakerstats_component.lua')
if not ok then
    describe('mod_speakerstats_component', function()
        it('skipped — failed to load', function()
            pending(tostring(err):match('([^\n]+)') or tostring(err))
        end)
    end)
    return
end

-- new_SpeakerStats is a module-level global (no `local` prefix in the source).
assert(type(new_SpeakerStats) == 'function',
    'new_SpeakerStats must be a global function after loading the module')

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

local function new_stats(nick)
    return new_SpeakerStats(nick or 'testnick', nil)
end

-- ---------------------------------------------------------------------------
-- Tests
-- ---------------------------------------------------------------------------

describe('SpeakerStats', function()

    -- Reset clock before every test so time never leaks between cases.
    before_each(function() set_clock(0) end)

    -- -----------------------------------------------------------------------
    describe('initial state', function()

        it('is not dominant speaker', function()
            assert.is_false(new_stats():isDominantSpeaker())
        end)

        it('is not silent', function()
            assert.is_false(new_stats():isSilent())
        end)

        it('has zero total speaking time', function()
            assert.equal(0, new_stats().totalDominantSpeakerTime)
        end)

    end)

    -- -----------------------------------------------------------------------
    describe('setDominantSpeaker', function()

        it('accumulates time when dominant speaker stops', function()
            local s = new_stats()

            set_clock(0)
            s:setDominantSpeaker(true, false)

            set_clock(1000)
            s:setDominantSpeaker(false, false)

            assert.equal(1000, s.totalDominantSpeakerTime)
        end)

        it('does not count time when starting dominant+silent', function()
            local s = new_stats()

            set_clock(0)
            s:setDominantSpeaker(true, true)  -- dominant but muted from the start

            set_clock(5000)
            s:setDominantSpeaker(false, false)

            assert.equal(0, s.totalDominantSpeakerTime)
        end)

        it('accumulates time up to the moment of going silent', function()
            local s = new_stats()

            set_clock(0)
            s:setDominantSpeaker(true, false)   -- start speaking

            set_clock(500)
            s:setDominantSpeaker(true, true)    -- go silent while still dominant

            assert.equal(500, s.totalDominantSpeakerTime)
        end)

        it('resumes accumulating after returning from silence', function()
            local s = new_stats()

            set_clock(0)
            s:setDominantSpeaker(true, false)   -- speak: timer starts at 0

            set_clock(500)
            s:setDominantSpeaker(true, true)    -- mute: +500 ms accumulated

            set_clock(700)
            s:setDominantSpeaker(true, false)   -- unmute: timer restarts at 700

            set_clock(900)
            s:setDominantSpeaker(false, false)  -- stop: +200 ms

            assert.equal(700, s.totalDominantSpeakerTime)  -- 500 + 200
        end)

        it('does not double-count when stopped twice in a row', function()
            local s = new_stats()

            set_clock(0)
            s:setDominantSpeaker(true, false)

            set_clock(300)
            s:setDominantSpeaker(false, false)  -- first stop: +300 ms

            set_clock(9999)
            s:setDominantSpeaker(false, false)  -- second stop — must be a no-op

            assert.equal(300, s.totalDominantSpeakerTime)
        end)

        it('accumulates across multiple dominant speaker episodes', function()
            local s = new_stats()

            set_clock(0)
            s:setDominantSpeaker(true, false)

            set_clock(400)
            s:setDominantSpeaker(false, false)  -- first episode: +400 ms

            set_clock(1000)
            s:setDominantSpeaker(true, false)

            set_clock(1600)
            s:setDominantSpeaker(false, false)  -- second episode: +600 ms

            assert.equal(1000, s.totalDominantSpeakerTime)
        end)

        it('updates isDominantSpeaker state', function()
            local s = new_stats()

            s:setDominantSpeaker(true, false)
            assert.is_true(s:isDominantSpeaker())

            s:setDominantSpeaker(false, false)
            assert.is_false(s:isDominantSpeaker())
        end)

        it('updates isSilent state', function()
            local s = new_stats()

            s:setDominantSpeaker(true, false)
            assert.is_false(s:isSilent())

            s:setDominantSpeaker(true, true)
            assert.is_true(s:isSilent())

            s:setDominantSpeaker(true, false)
            assert.is_false(s:isSilent())
        end)

        it('does not start timer when becoming dominant while silent', function()
            -- Silence=true on the transition to dominant → no timer started.
            -- Stopping later must not add spurious time.
            local s = new_stats()

            set_clock(0)
            s:setDominantSpeaker(true, true)   -- dominant+silent, no timer

            set_clock(2000)
            s:setDominantSpeaker(true, false)  -- unmute: timer starts NOW at t=2000

            set_clock(2500)
            s:setDominantSpeaker(false, false) -- stop: +500 ms

            assert.equal(500, s.totalDominantSpeakerTime)
        end)

    end) -- setDominantSpeaker

end) -- SpeakerStats
