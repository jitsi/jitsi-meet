-- Unit tests for mod_token_affiliation.lua
-- Run with busted from resources/prosody-plugins/:
--   busted ../../tests/prosody/lua/
--
-- Stubs every Prosody dependency so no Prosody installation is needed.
--
-- JWT claim correctness and role/affiliation values are covered by the
-- integration tests in mod_token_affiliation_spec.js.  These unit tests
-- focus on skip conditions (healthcheck rooms, admin occupants, missing tokens)
-- and the correct affiliation derived from various token claims.

-- ---------------------------------------------------------------------------
-- Captured hooks
-- ---------------------------------------------------------------------------

local pre_join_fn = nil

-- ---------------------------------------------------------------------------
-- Stubs
-- ---------------------------------------------------------------------------

local is_healthcheck_stub = false
local is_admin_stub       = false

local util_stub = {
    is_admin            = function(_jid) return is_admin_stub end,
    is_healthcheck_room = function(_jid) return is_healthcheck_stub end,
}

_G.module = {
    host = 'conference.example.com',
    log  = function() end,
    get_option_string = function(_, _key, default) return default end,
    require = function(_, name)
        if name == 'util' then return util_stub end
        return {}
    end,
    hook = function(_, event, fn)
        if event == 'muc-occupant-pre-join' then pre_join_fn = fn end
    end,
}

-- ---------------------------------------------------------------------------
-- Load the module under test
-- ---------------------------------------------------------------------------

local ok, load_err = pcall(dofile, 'mod_token_affiliation.lua')
if not ok then
    describe("mod_token_affiliation", function()
        it("skipped — failed to load module", function()
            pending(tostring(load_err):match("([^\n]+)") or tostring(load_err))
        end)
    end)
    return
end

assert(pre_join_fn, "mod_token_affiliation did not hook 'muc-occupant-pre-join'")

-- ---------------------------------------------------------------------------
-- Test helpers
-- ---------------------------------------------------------------------------

local jid_counter = 0
local function fresh_jid()
    jid_counter = jid_counter + 1
    return string.format("user%d@example.com", jid_counter)
end

local function make_room()
    local room = {
        jid             = 'testroom@conference.example.com',
        affiliation_log = {},
    }
    function room:set_affiliation(actor, bare_jid, affiliation)
        table.insert(self.affiliation_log, { actor = actor, jid = bare_jid, affiliation = affiliation })
    end
    return room
end

local function make_occupant(bare_jid)
    return { jid = bare_jid .. '/res', bare_jid = bare_jid, role = 'participant' }
end

local function make_session(opts)
    opts = opts or {}
    local auth_token
    if not opts.no_token then auth_token = 'test.token.value' end
    return {
        auth_token              = auth_token,
        jitsi_meet_context_user = opts.context_user,
    }
end

local function run_pre_join(room, occupant, session)
    pre_join_fn({ room = room, occupant = occupant, origin = session })
end

-- ---------------------------------------------------------------------------
-- Tests
-- ---------------------------------------------------------------------------

describe("mod_token_affiliation", function()

    before_each(function()
        is_healthcheck_stub = false
        is_admin_stub       = false
    end)

    -- -----------------------------------------------------------------------
    describe("skip conditions in muc-occupant-pre-join", function()

        it("healthcheck room — no affiliation set", function()
            is_healthcheck_stub = true
            local room     = make_room()
            local occupant = make_occupant(fresh_jid())
            local session  = make_session({ context_user = { moderator = true } })
            run_pre_join(room, occupant, session)
            assert.equal(0, #room.affiliation_log)
        end)

        it("admin occupant — no affiliation set", function()
            is_admin_stub = true
            local room     = make_room()
            local occupant = make_occupant(fresh_jid())
            local session  = make_session({ context_user = { moderator = true } })
            run_pre_join(room, occupant, session)
            assert.equal(0, #room.affiliation_log)
        end)

        it("no token — no affiliation set", function()
            local room     = make_room()
            local occupant = make_occupant(fresh_jid())
            local session  = make_session({ no_token = true, context_user = { moderator = true } })
            run_pre_join(room, occupant, session)
            assert.equal(0, #room.affiliation_log)
        end)

        it("nil session — no affiliation set", function()
            local room     = make_room()
            local occupant = make_occupant(fresh_jid())
            run_pre_join(room, occupant, nil)
            assert.equal(0, #room.affiliation_log)
        end)

    end)

    -- -----------------------------------------------------------------------
    describe("affiliation assignment", function()

        it("moderator=true sets owner affiliation and moderator role", function()
            local room     = make_room()
            local occupant = make_occupant(fresh_jid())
            local session  = make_session({ context_user = { moderator = true } })
            run_pre_join(room, occupant, session)
            assert.equal(1, #room.affiliation_log)
            assert.equal("owner",     room.affiliation_log[1].affiliation)
            assert.equal("moderator", occupant.role)
        end)

        it("moderator='true' sets owner affiliation", function()
            local room     = make_room()
            local occupant = make_occupant(fresh_jid())
            local session  = make_session({ context_user = { moderator = 'true' } })
            run_pre_join(room, occupant, session)
            assert.equal("owner", room.affiliation_log[1].affiliation)
        end)

        it("affiliation='owner' sets owner", function()
            local room     = make_room()
            local occupant = make_occupant(fresh_jid())
            local session  = make_session({ context_user = { affiliation = 'owner' } })
            run_pre_join(room, occupant, session)
            assert.equal("owner", room.affiliation_log[1].affiliation)
        end)

        it("affiliation='moderator' sets owner", function()
            local room     = make_room()
            local occupant = make_occupant(fresh_jid())
            local session  = make_session({ context_user = { affiliation = 'moderator' } })
            run_pre_join(room, occupant, session)
            assert.equal("owner", room.affiliation_log[1].affiliation)
        end)

        it("affiliation='teacher' sets owner", function()
            local room     = make_room()
            local occupant = make_occupant(fresh_jid())
            local session  = make_session({ context_user = { affiliation = 'teacher' } })
            run_pre_join(room, occupant, session)
            assert.equal("owner", room.affiliation_log[1].affiliation)
        end)

        it("authenticated non-moderator sets member affiliation, role unchanged", function()
            local room     = make_room()
            local occupant = make_occupant(fresh_jid())
            local session  = make_session({ context_user = { id = 'plainuser' } })
            run_pre_join(room, occupant, session)
            assert.equal(1, #room.affiliation_log)
            assert.equal("member",      room.affiliation_log[1].affiliation)
            assert.equal("participant", occupant.role)
        end)

        it("moderator=false sets member affiliation", function()
            local room     = make_room()
            local occupant = make_occupant(fresh_jid())
            local session  = make_session({ context_user = { moderator = false } })
            run_pre_join(room, occupant, session)
            assert.equal("member", room.affiliation_log[1].affiliation)
        end)

    end)

end) -- mod_token_affiliation
