-- Unit tests for mod_token_verification.lua
-- Run with busted from resources/prosody-plugins/:
--   busted ../../tests/prosody/lua/
--
-- Stubs every Prosody dependency so no Prosody installation is needed.
-- These cover which s2s joins skip the room check: on a visitor node (main_domain is set) the
-- main participants that come over s2s skip it, on the main prosody every join is verified.

-- ---------------------------------------------------------------------------
-- Stubs for top-level `require`d Prosody libs
-- ---------------------------------------------------------------------------

-- Installed in package.preload only while the module loads, so they do not leak into the specs that
-- run after this one in the same busted process (e.g. one that requires the real util.stanza).
local stubs = {}

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
        bare = function(j) return j and j:match('^([^/]+)') end,
        host = function(j) return select(2, split(j)) end,
    }
end

stubs['util.stanza'] = function()
    return {
        error_reply = function(_, error_type, condition, text)
            local reply = { error_type = error_type, condition = condition, text = text }
            function reply:tag() return self end
            return reply
        end,
    }
end

-- ---------------------------------------------------------------------------
-- Module stub, reloaded per configuration
-- ---------------------------------------------------------------------------

local MUC_HOST = 'conference.example.com'
local FOCUS_JID = 'focus@auth.example.com'
local ROOM_JID = 'room@' .. MUC_HOST

-- The rooms that token_util:verify_room was called for.
local verified
local pre_join_fn
local pre_create_fn

-- A session without a token does not match any room, as with allow_empty_token = false.
local token_util_stub = {
    verify_room = function(_, session, room_jid)
        table.insert(verified, room_jid)
        return session.auth_token ~= nil
    end,
}

local util_stub = {
    is_admin = function(j) return j and j:match('^([^/]+)') == FOCUS_JID end,
    strip_jwt_signature = function(t) return t end,
}

local function load_module(options)
    verified = {}
    pre_join_fn = nil
    pre_create_fn = nil

    _G.prosody = { hosts = {} }
    _G.module = {
        host = MUC_HOST,
        _log = function() end,
        log = function() end,
        measure = function() return function() end end,
        context = function() return {} end,
        get_option_boolean = function(_, key) return options[key] end,
        get_option_string = function(_, key) return options[key] end,
        get_option_set = function()
            return { contains = function() return false end }
        end,
        require = function(_, name)
            if name == 'util' then return util_stub end
            return { new = function() return token_util_stub end }
        end,
        hook = function(_, event, fn)
            if event == 'muc-occupant-pre-join' then pre_join_fn = fn end
            if event == 'muc-room-pre-create' then pre_create_fn = fn end
        end,
        hook_global = function() end,
    }

    local saved = {}
    for name, loader in pairs(stubs) do
        saved[name] = { preload = package.preload[name], loaded = package.loaded[name] }
        package.preload[name] = loader
        package.loaded[name] = nil
    end

    local ok, err = pcall(dofile, 'mod_token_verification.lua')

    for name, previous in pairs(saved) do
        package.preload[name] = previous.preload
        package.loaded[name] = previous.loaded
    end
    assert(ok, err)
    assert(pre_join_fn, "mod_token_verification did not hook 'muc-occupant-pre-join'")
    assert(pre_create_fn, "mod_token_verification did not hook 'muc-room-pre-create'")
end

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

-- A tokenless session of the given type. Error replies sent to it are kept in session.sent.
local function new_session(session_type)
    local session = { type = session_type, sent = {} }
    session.send = function(stanza) table.insert(session.sent, stanza) end
    return session
end

local function join(fn, session, from)
    return fn({
        origin = session,
        room = { jid = ROOM_JID },
        stanza = { attr = { from = from, to = ROOM_JID .. '/nick' } },
    })
end

-- ---------------------------------------------------------------------------
-- Tests
-- ---------------------------------------------------------------------------

describe('mod_token_verification', function()

    describe('on the main prosody', function()
        before_each(function() load_module({}) end)

        it('verifies the room of a join that comes over s2s', function()
            local session = new_session('s2sin')

            assert.is_true(join(pre_join_fn, session, 'visitor@v0.meet.jitsi/res'))
            assert.are.same({ ROOM_JID .. '/nick' }, verified)
            assert.are.equal('not-allowed', session.sent[1].condition)
        end)

        it('verifies the room of a room create that comes over s2s', function()
            local session = new_session('s2sin')

            assert.is_true(join(pre_create_fn, session, 'visitor@v0.meet.jitsi/res'))
            assert.are.equal(1, #verified)
        end)

        it('does not verify the room for an admin', function()
            assert.is_nil(join(pre_join_fn, new_session('c2s'), FOCUS_JID .. '/focus'))
            assert.are.equal(0, #verified)
        end)
    end)

    describe('on a visitor node', function()
        before_each(function() load_module({ main_domain = 'example.com' }) end)

        it('lets a main participant that comes over s2s join without a room check', function()
            local session = new_session('s2sin')

            assert.is_nil(join(pre_join_fn, session, 'user@example.com/res'))
            assert.are.equal(0, #verified)
            assert.are.equal(0, #session.sent)
        end)

        it('verifies the room of a join from a client of the visitor node', function()
            local session = new_session('c2s')

            assert.is_true(join(pre_join_fn, session, 'visitor@v0.meet.jitsi/res'))
            assert.are.equal(1, #verified)
            assert.are.equal('not-allowed', session.sent[1].condition)
        end)
    end)
end)
