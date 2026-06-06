-- Unit tests for mod_muc_domain_mapper.lua
-- Run with busted from resources/prosody-plugins/:
--   busted spec/lua/
--
-- Stubs every Prosody dependency so no Prosody installation is needed.

-- ---------------------------------------------------------------------------
-- Stanza / session helpers
-- ---------------------------------------------------------------------------

local function make_stanza(name, attrs, children)
    local s = { name = name, attr = attrs or {}, _children = children or {} }
    function s:get_child(cname, _ns)
        for _, c in ipairs(self._children) do
            if c.name == cname then return c end
        end
        return nil
    end
    return s
end

local function make_session(session_type)
    local logs = {}
    return {
        type         = session_type or "c2s",
        log_calls    = logs,
        -- session.log is called as session.log(level, msg, ...) (not method syntax)
        log          = function(level, _msg, ...)
            table.insert(logs, level)
        end,
    }
end

-- ---------------------------------------------------------------------------
-- Call-tracking rewrite stubs (reset before each test via clear helpers)
-- ---------------------------------------------------------------------------

local rewrite_to_calls   = {}
local rewrite_from_calls = {}

local function clear_calls()
    for i = #rewrite_to_calls,   1, -1 do rewrite_to_calls[i]   = nil end
    for i = #rewrite_from_calls, 1, -1 do rewrite_from_calls[i] = nil end
end

local mock_util = {
    room_jid_match_rewrite = function(jid, _stanza)
        table.insert(rewrite_to_calls, jid)
        return "MAPPED:" .. (jid or "nil")
    end,
    internal_room_jid_match_rewrite = function(jid, _stanza)
        table.insert(rewrite_from_calls, jid)
        return "UNMAPPED:" .. (jid or "nil")
    end,
}

-- ---------------------------------------------------------------------------
-- Package preloads — must be registered before dofile()
-- ---------------------------------------------------------------------------

package.preload['util.filters'] = function()
    return {
        add_filter_hook    = function(_fn) end,
        remove_filter_hook = function(_fn) end,
        add_filter         = function(_session, _type, _fn) end,
    }
end

-- ---------------------------------------------------------------------------
-- Global stubs required by the module at load time
-- ---------------------------------------------------------------------------

_G.prosody = {
    events = { add_handler = function() end },
    hosts  = {},
}

_G.module = {
    host    = "localhost",
    log     = function() end,
    get_option_string = function(_, key, default)
        if key == "muc_mapper_domain_base" then return "localhost" end
        return default
    end,
    get_option_boolean = function(_, key, default)
        if key == "muc_mapper_log_not_allowed_errors" then return true end
        return default
    end,
    require = function(_, name)
        if name == "util" then return mock_util end
        return nil
    end,
    context = function(_, _host)
        return { hook = function() end }
    end,
}

-- ---------------------------------------------------------------------------
-- Load the module under test
-- ---------------------------------------------------------------------------

local ok, err = pcall(dofile, "mod_muc_domain_mapper.lua")
if not ok then
    describe("mod_muc_domain_mapper", function()
        it("skipped — failed to load", function()
            pending(tostring(err):match("([^\n]+)") or tostring(err))
        end)
    end)
    return
end

local filter_stanza = _G.filter_stanza
assert(filter_stanza, "filter_stanza must be a global after dofile()")

-- ---------------------------------------------------------------------------
-- Tests
-- ---------------------------------------------------------------------------

describe("mod_muc_domain_mapper", function()

    before_each(clear_calls)

    -- -----------------------------------------------------------------------
    describe("filter_stanza", function()

        -- -------------------------------------------------------------------
        describe("message stanzas", function()

            it("rewrites 'to' via room_jid_match_rewrite", function()
                local stanza  = make_stanza("message", { to = "room@conference.sub.example.com" })
                local session = make_session("c2s")

                local result = filter_stanza(stanza, session)

                assert.equal(1, #rewrite_to_calls)
                assert.equal("room@conference.sub.example.com", rewrite_to_calls[1])
                assert.equal("MAPPED:room@conference.sub.example.com", result.attr.to)
            end)

            it("rewrites 'from' via internal_room_jid_match_rewrite", function()
                local stanza  = make_stanza("message", { from = "[sub]room@conference.example.com/nick" })
                local session = make_session("c2s")

                local result = filter_stanza(stanza, session)

                assert.equal(1, #rewrite_from_calls)
                assert.equal("[sub]room@conference.example.com/nick", rewrite_from_calls[1])
                assert.equal("UNMAPPED:[sub]room@conference.example.com/nick", result.attr.from)
            end)

            it("rewrites both 'to' and 'from' when both are set", function()
                local stanza  = make_stanza("message", {
                    to   = "room@conference.sub.example.com",
                    from = "[sub]room@conference.example.com/nick",
                })
                filter_stanza(stanza, make_session("c2s"))

                assert.equal(1, #rewrite_to_calls)
                assert.equal(1, #rewrite_from_calls)
            end)

            it("does not call rewrites when 'to' and 'from' are absent", function()
                local stanza = make_stanza("message", {})
                filter_stanza(stanza, make_session("c2s"))

                assert.equal(0, #rewrite_to_calls)
                assert.equal(0, #rewrite_from_calls)
            end)

        end)

        -- -------------------------------------------------------------------
        describe("presence stanzas", function()

            it("rewrites 'to' and 'from'", function()
                local stanza  = make_stanza("presence", {
                    to   = "room@conference.sub.example.com/nick",
                    from = "[sub]room@conference.example.com/nick",
                })
                filter_stanza(stanza, make_session("c2s"))

                assert.equal(1, #rewrite_to_calls)
                assert.equal(1, #rewrite_from_calls)
            end)

        end)

        -- -------------------------------------------------------------------
        describe("iq stanzas", function()

            it("rewrites 'to' and 'from'", function()
                local stanza  = make_stanza("iq", {
                    to   = "room@conference.sub.example.com",
                    from = "[sub]room@conference.example.com",
                })
                filter_stanza(stanza, make_session("c2s"))

                assert.equal(1, #rewrite_to_calls)
                assert.equal(1, #rewrite_from_calls)
            end)

            it("rewrites <conference room> attribute when child is present", function()
                local conf    = make_stanza("conference", { room = "room@conference.sub.example.com" })
                local stanza  = make_stanza("iq", { to = "focus@example.com" }, { conf })
                filter_stanza(stanza, make_session("c2s"))

                -- room attr on the child gets rewritten
                assert.equal("MAPPED:room@conference.sub.example.com", conf.attr.room)
                -- 'to' also gets rewritten (focus@example.com passes through the mock)
                assert.equal(2, #rewrite_to_calls)
            end)

            it("does not touch stanzas with no <conference> child", function()
                local stanza = make_stanza("iq", { to = "focus@example.com" })
                filter_stanza(stanza, make_session("c2s"))

                assert.equal(1, #rewrite_to_calls)
                assert.equal(0, #rewrite_from_calls)
            end)

        end)

        -- -------------------------------------------------------------------
        describe("skipped stanzas", function()

            it("passes stanza through unchanged when skipMapping is true", function()
                local stanza  = make_stanza("message", { to = "room@conference.sub.example.com" })
                stanza.skipMapping = true
                filter_stanza(stanza, make_session("c2s"))

                assert.equal(0, #rewrite_to_calls)
                assert.equal("room@conference.sub.example.com", stanza.attr.to)
            end)

            it("passes stanza through unchanged for s2sout sessions", function()
                local stanza  = make_stanza("message", { to = "room@conference.sub.example.com" })
                filter_stanza(stanza, make_session("s2sout"))

                assert.equal(0, #rewrite_to_calls)
            end)

            it("passes non-message/iq/presence stanzas through unchanged", function()
                local stanza  = make_stanza("stream:features", { to = "example.com" })
                filter_stanza(stanza, make_session("c2s"))

                assert.equal(0, #rewrite_to_calls)
                assert.equal(0, #rewrite_from_calls)
            end)

        end)

        -- -------------------------------------------------------------------
        describe("log_not_allowed_errors", function()

            local function make_not_allowed_presence()
                local not_allowed = make_stanza("not-allowed",
                    { xmlns = "urn:ietf:params:xml:ns:xmpp-stanzas" })
                local error_el = make_stanza("error", { type = "cancel" }, { not_allowed })
                return make_stanza("presence", { type = "error" }, { error_el })
            end

            it("logs a not-allowed presence error once per session", function()
                local stanza  = make_not_allowed_presence()
                local session = make_session("c2s")

                filter_stanza(stanza, session)

                assert.equal(1, #session.log_calls)
                assert.equal("error", session.log_calls[1])
                assert.is_true(session.jitsi_not_allowed_logged)
            end)

            it("does not log a second time on the same session", function()
                local stanza  = make_not_allowed_presence()
                local session = make_session("c2s")

                filter_stanza(stanza, session)
                filter_stanza(stanza, session)

                assert.equal(1, #session.log_calls)
            end)

            it("does not log for non-error presence", function()
                local stanza  = make_stanza("presence", { to = "room@conference.sub.example.com" })
                local session = make_session("c2s")

                filter_stanza(stanza, session)

                assert.equal(0, #session.log_calls)
            end)

            it("does not log when error type is not 'cancel'", function()
                local not_allowed = make_stanza("not-allowed",
                    { xmlns = "urn:ietf:params:xml:ns:xmpp-stanzas" })
                local error_el = make_stanza("error", { type = "auth" }, { not_allowed })
                local stanza   = make_stanza("presence", { type = "error" }, { error_el })
                local session  = make_session("c2s")

                filter_stanza(stanza, session)

                assert.equal(0, #session.log_calls)
            end)

        end)

    end)

end)
