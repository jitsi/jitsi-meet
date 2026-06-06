-- Unit tests for util.lib.lua
-- Run with busted from resources/prosody-plugins/:
--   busted spec/lua/
--
-- Stubs every Prosody dependency so no Prosody installation is needed.
-- Functions that rely on live Prosody objects (async HTTP, room lookup,
-- stanza mutation, etc.) are not covered here — they are exercised by the
-- integration tests.
--
-- Module is loaded with:
--   muc_domain_prefix = "conference"  (default)
--   muc_domain_base   = "test.example.com"  (module.host default)
--   muc_domain        = "conference.test.example.com"
--   moderated_subdomains = {"moderated-subdomain"}
--   moderated_rooms      = {"moderatedroom"}

-- ---------------------------------------------------------------------------
-- Minimal Set implementation (mirrors Prosody's util.set behaviour)
-- ---------------------------------------------------------------------------

local Set_mt = {}
Set_mt.__index = Set_mt
-- set / fn  →  new set with fn mapped over every element
Set_mt.__div = function(self, fn)
    local new_s = setmetatable({ _data = {}, _is_set = true }, Set_mt)
    for k in pairs(self._data) do
        local mapped = fn(k)
        if mapped ~= nil then new_s._data[mapped] = true end
    end
    return new_s
end
function Set_mt:contains(v) return self._data[v] == true end
function Set_mt:empty()     return next(self._data) == nil end
function Set_mt:items()     return pairs(self._data) end

local function new_set(list)
    local s = setmetatable({ _data = {}, _is_set = true }, Set_mt)
    for _, v in ipairs(list or {}) do s._data[v] = true end
    return s
end

-- ---------------------------------------------------------------------------
-- Package preloads — must be registered before dofile()
-- ---------------------------------------------------------------------------

package.preload['util.set'] = function()
    return {
        is_set = function(v) return type(v) == 'table' and v._is_set == true end,
        new    = new_set,
    }
end

package.preload['util.jid'] = function()
    local function jid_split(j)
        if not j then return nil, nil, nil end
        local node, host, resource
        local at    = j:find('@')
        local slash
        if at then
            slash = j:find('/', at + 1)
            node  = j:sub(1, at - 1)
            if slash then
                host     = j:sub(at + 1, slash - 1)
                resource = j:sub(slash + 1)
            else
                host = j:sub(at + 1)
            end
        else
            slash = j:find('/')
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
        split = jid_split,
        join  = function(node, host, resource)
            local j = ''
            if node then j = node .. '@' end
            j = j .. (host or '')
            if resource then j = j .. '/' .. resource end
            return j
        end,
        prep  = function(j) return j end,
        bare  = function(j)
            if not j then return nil end
            local node, host = jid_split(j)
            if node then return node .. '@' .. (host or '') end
            return host
        end,
        node  = function(j)
            if not j then return nil end
            local node = jid_split(j)
            return node
        end,
    }
end

package.preload['util.cache'] = function()
    return {
        new = function(_size)
            local t = {}
            return {
                get = function(_, k) return t[k] end,
                set = function(_, k, v) t[k] = v end,
            }
        end,
    }
end

package.preload['util.array'] = function()
    local Array_mt = {}
    Array_mt.__index = Array_mt
    function Array_mt:push(v)
        self[#self + 1] = v
        return self
    end
    return function()
        return setmetatable({}, Array_mt)
    end
end

-- Modules used only by functions we do not test — empty stubs suffice.
package.preload['util.stanza']       = function() return {} end
package.preload['util.timer']        = function() return { add_task = function() end } end
package.preload['util.async']        = function() return {} end
package.preload['net.http']          = function() return {} end
package.preload['net.http.server']   = function() return {} end
package.preload['core.usermanager']  = function() return {} end

-- ---------------------------------------------------------------------------
-- Global stubs required by util.lib.lua at module load time
--
-- Busted sandboxes spec files via setfenv: bare assignments like
--   module = {...}
-- go into the busted context env, not _G. But dofile() always runs chunks
-- in _G. So any global that util.lib.lua reads at load time must be written
-- directly into _G via  _G.key = value.
-- package.preload is exempt — setting a key there mutates the real table.
-- ---------------------------------------------------------------------------

_G.prosody = { version = "test", platform = "posix" }
_G.hosts   = {}

local mod = { host = "test.example.com" }

mod.log = function() end
mod.get_option_string = function(_, _key, default) return default end

mod.get_option_set = function(_, key, default)
    -- Populate the sets inspected by is_moderated() with test fixtures.
    if key == "allowners_moderated_subdomains" then
        return new_set({ "moderated-subdomain" })
    elseif key == "allowners_moderated_rooms" then
        return new_set({ "moderatedroom" })
    end
    return new_set(type(default) == 'table' and default or {})
end

mod.get_option_inherited_set = function(_, _key, default)
    return new_set(type(default) == 'table' and default or {})
end

mod.context = function(_, _host)
    return {
        get_option_set = function(_, _key, default)
            return new_set(type(default) == 'table' and default or {})
        end,
    }
end

_G.module = mod

-- ---------------------------------------------------------------------------
-- Load the module under test
-- ---------------------------------------------------------------------------

local ok, M = pcall(dofile, "util.lib.lua")
if not ok then
    describe("util.lib", function()
        it("skipped — failed to load", function()
            pending(tostring(M):match("([^\n]+)") or tostring(M))
        end)
    end)
    return
end

-- Convenience: muc_domain derived from the defaults above
local MUC_DOMAIN   = "conference.test.example.com"
local MUC_BASE     = "test.example.com"
local MUC_PREFIX   = "conference"

-- ---------------------------------------------------------------------------
-- Tests
-- ---------------------------------------------------------------------------

describe("util.lib", function()

    -- -----------------------------------------------------------------------
    describe("starts_with", function()
        it("returns false for nil string", function()
            assert.is_false(M.starts_with(nil, "x"))
        end)

        it("returns true when string starts with prefix", function()
            assert.is_true(M.starts_with("hello world", "hello"))
        end)

        it("returns false when string does not start with prefix", function()
            assert.is_false(M.starts_with("hello", "world"))
        end)

        it("returns true for empty prefix", function()
            assert.is_true(M.starts_with("hello", ""))
        end)

        it("returns true when string equals prefix exactly", function()
            assert.is_true(M.starts_with("abc", "abc"))
        end)

        it("returns false when prefix is longer than string", function()
            assert.is_false(M.starts_with("hi", "hello"))
        end)
    end)

    -- -----------------------------------------------------------------------
    describe("ends_with", function()
        it("returns false for nil string", function()
            assert.is_false(M.ends_with(nil, "x"))
        end)

        it("returns true when string ends with suffix", function()
            assert.is_true(M.ends_with("hello", "llo"))
        end)

        it("returns false when string does not end with suffix", function()
            assert.is_false(M.ends_with("hello", "world"))
        end)

        it("returns true for empty suffix", function()
            assert.is_true(M.ends_with("hello", ""))
        end)

        it("returns true when string equals suffix exactly", function()
            assert.is_true(M.ends_with("abc", "abc"))
        end)
    end)

    -- -----------------------------------------------------------------------
    describe("starts_with_one_of", function()
        it("returns false for nil string", function()
            assert.is_false(M.starts_with_one_of(nil, { "a" }))
        end)

        it("returns false for nil prefixes", function()
            assert.is_false(M.starts_with_one_of("hello", nil))
        end)

        it("matches against a plain table of prefixes", function()
            assert.is_truthy(M.starts_with_one_of("recorder@example.com", { "recorder@", "jibri@" }))
        end)

        it("returns false when no prefix in table matches", function()
            assert.is_false(M.starts_with_one_of("user@example.com", { "recorder@", "jibri@" }))
        end)

        it("matches against a Set of prefixes", function()
            local prefixes = new_set({ "recorder@", "jibri@" })
            assert.is_truthy(M.starts_with_one_of("recorder@example.com", prefixes))
        end)

        it("returns false when no prefix in Set matches", function()
            local prefixes = new_set({ "recorder@", "jibri@" })
            assert.is_false(M.starts_with_one_of("user@example.com", prefixes))
        end)

        it("returns the matched prefix value (table)", function()
            assert.equal("rec@", M.starts_with_one_of("rec@host", { "rec@", "other@" }))
        end)
    end)

    -- -----------------------------------------------------------------------
    describe("is_healthcheck_room", function()
        it("recognises a jicofo health-check room", function()
            assert.is_true(M.is_healthcheck_room("__jicofo-health-check-abc@conference.example.com"))
        end)

        it("recognises the bare prefix itself", function()
            assert.is_true(M.is_healthcheck_room("__jicofo-health-check"))
        end)

        it("returns false for a regular room", function()
            assert.is_false(M.is_healthcheck_room("myroom@conference.example.com"))
        end)

        it("returns false for nil", function()
            assert.is_false(M.is_healthcheck_room(nil))
        end)
    end)

    -- -----------------------------------------------------------------------
    describe("is_feature_allowed", function()
        it("returns is_moderator when features table is absent", function()
            assert.is_true(M.is_feature_allowed("feature", nil, true))
            assert.is_false(M.is_feature_allowed("feature", nil, false))
        end)

        it("returns true when feature value is the string 'true'", function()
            assert.is_true(M.is_feature_allowed("f", { f = "true" }, false))
        end)

        it("returns true when feature value is boolean true", function()
            assert.is_true(M.is_feature_allowed("f", { f = true }, false))
        end)

        it("returns false when feature is present but set to false", function()
            assert.is_false(M.is_feature_allowed("f", { f = false }, true))
        end)

        it("returns false when feature is absent from table", function()
            assert.is_false(M.is_feature_allowed("f", { g = "true" }, false))
        end)
    end)

    -- -----------------------------------------------------------------------
    describe("extract_subdomain", function()
        it("returns nil subdomain and the node itself when no brackets", function()
            local subdomain, room, customer_id = M.extract_subdomain("myroom")
            assert.is_nil(subdomain)
            assert.equal("myroom", room)
            assert.is_nil(customer_id)
        end)

        it("extracts subdomain and room name from [sub]room format", function()
            local subdomain, room = M.extract_subdomain("[foo]myroom")
            assert.equal("foo", subdomain)
            assert.equal("myroom", room)
        end)

        it("extracts subdomain from vpaas magic cookie node", function()
            local subdomain, room, customer_id =
                M.extract_subdomain("[vpaas-magic-cookie-abc123]myroom")
            assert.equal("vpaas-magic-cookie-abc123", subdomain)
            assert.equal("myroom", room)
            assert.equal("abc123", customer_id)
        end)

        it("returns no customer_id for non-vpaas subdomain", function()
            local subdomain, room, customer_id = M.extract_subdomain("[tenant]myroom")
            assert.equal("tenant", subdomain)
            assert.equal("myroom", room)
            assert.is_nil(customer_id)
        end)

        it("returns nil subdomain for empty brackets (pattern requires >=1 char)", function()
            -- "[]room" does not match ^%[([^%]]+)%](.+)$
            local subdomain, room = M.extract_subdomain("[]room")
            assert.is_nil(subdomain)
            assert.equal("[]room", room)
        end)
    end)

    -- -----------------------------------------------------------------------
    -- room_jid_split_subdomain / room_jid_match_rewrite /
    -- internal_room_jid_match_rewrite
    --
    -- With the default stubs:
    --   muc_domain_prefix = "conference"
    --   muc_domain_base   = "test.example.com"
    --   target_subdomain_pattern matches conference.<sub>.test.example.com
    -- -----------------------------------------------------------------------
    describe("room_jid_split_subdomain", function()
        it("extracts node, host, resource and subdomain from a multidomain JID", function()
            local node, host, resource, subdomain =
                M.room_jid_split_subdomain("room1@conference.foo.test.example.com/res")
            assert.equal("room1", node)
            assert.equal("conference.foo.test.example.com", host)
            assert.equal("res", resource)
            assert.equal("foo", subdomain)
        end)

        it("returns nil subdomain for a non-multidomain MUC JID", function()
            local node, host, _, subdomain =
                M.room_jid_split_subdomain("room1@conference.test.example.com")
            assert.equal("room1", node)
            assert.equal("conference.test.example.com", host)
            assert.is_nil(subdomain)
        end)

        it("handles JID with no node (bare host)", function()
            local node, host, _, subdomain =
                M.room_jid_split_subdomain("conference.foo.test.example.com")
            assert.is_nil(node)
            assert.equal("conference.foo.test.example.com", host)
            assert.equal("foo", subdomain)
        end)

        -- Regression: target_subdomain_pattern used an unescaped '.' between the
        -- prefix and the subdomain capture group.  In Lua patterns '.' matches any
        -- character, so "conference-foo.test.example.com" (hyphen) was incorrectly
        -- treated as a subdomain JID with subdomain "foo".  The correct pattern
        -- requires a literal dot: "conference%.foo.test.example.com".
        it("returns nil subdomain for a hyphenated-prefix host (regression: unescaped dot)", function()
            -- 'conference-foo' shares the same base domain but is NOT a subdomain
            -- MUC component; the separator is a hyphen, not a dot.
            local _, _, _, subdomain =
                M.room_jid_split_subdomain("room@conference-foo.test.example.com")
            assert.is_nil(subdomain)
        end)

        it("returns nil subdomain when only the suffix differs by a non-dot character", function()
            -- e.g. conference.foo-test.example.com — the subdomain capture is
            -- [^%.]+, so a hyphen inside 'foo-test' is fine, but this test
            -- confirms the prefix boundary is strict.
            local _, _, _, subdomain =
                M.room_jid_split_subdomain("room@conferenceXfoo.test.example.com")
            assert.is_nil(subdomain)
        end)
    end)

    -- -----------------------------------------------------------------------
    describe("room_jid_match_rewrite", function()
        it("rewrites a multidomain JID to internal [sub]room@muc_domain form", function()
            local result = M.room_jid_match_rewrite("room1@conference.foo.test.example.com")
            assert.equal("[foo]room1@" .. MUC_DOMAIN, result)
        end)

        it("preserves the resource in the rewritten JID", function()
            local result = M.room_jid_match_rewrite("room1@conference.foo.test.example.com/r")
            assert.equal("[foo]room1@" .. MUC_DOMAIN .. "/r", result)
        end)

        it("returns the JID unchanged when there is no subdomain", function()
            local jid = "room1@" .. MUC_DOMAIN
            assert.equal(jid, M.room_jid_match_rewrite(jid))
        end)

        it("handles host-only JID (no node) — stores id in roomless_iqs and rewrites host", function()
            local stanza = { attr = { id = "iq-roomless-1", to = "conference.foo.test.example.com" } }
            local result = M.room_jid_match_rewrite("conference.foo.test.example.com", stanza)
            -- No node → only host is rewritten
            assert.equal(MUC_DOMAIN, result)
        end)

        -- Regression: unescaped '.' in target_subdomain_pattern caused
        -- "conference-internal.test.example.com" to be treated as a subdomain
        -- MUC host and rewritten to "[internal]room@conference.test.example.com".
        it("does not rewrite a JID whose host uses a hyphen after the prefix (regression)", function()
            local jid = "room@conference-internal.test.example.com"
            assert.equal(jid, M.room_jid_match_rewrite(jid))
        end)

        it("does not rewrite a JID whose host uses an arbitrary non-dot separator after the prefix", function()
            local jid = "room@conferenceXinternal.test.example.com"
            assert.equal(jid, M.room_jid_match_rewrite(jid))
        end)
    end)

    -- -----------------------------------------------------------------------
    describe("internal_room_jid_match_rewrite", function()
        it("rewrites an internal [sub]room JID back to pretty conference.sub.base/room form", function()
            local result = M.internal_room_jid_match_rewrite("[foo]room1@" .. MUC_DOMAIN)
            assert.equal("room1@" .. MUC_PREFIX .. ".foo." .. MUC_BASE, result)
        end)

        it("preserves resource in the rewritten JID", function()
            local result = M.internal_room_jid_match_rewrite("[foo]room1@" .. MUC_DOMAIN .. "/res")
            assert.equal("room1@" .. MUC_PREFIX .. ".foo." .. MUC_BASE .. "/res", result)
        end)

        it("returns JID unchanged when host is not the MUC domain", function()
            local jid = "room1@other.domain.com"
            assert.equal(jid, M.internal_room_jid_match_rewrite(jid))
        end)

        it("returns JID unchanged when node lacks [sub] prefix", function()
            local jid = "room1@" .. MUC_DOMAIN
            assert.equal(jid, M.internal_room_jid_match_rewrite(jid))
        end)

        it("resolves a roomless IQ stored by room_jid_match_rewrite", function()
            local stanza = { attr = { id = "iq-roomless-2", to = "conference.bar.test.example.com" } }
            -- Trigger storage of the roomless IQ
            M.room_jid_match_rewrite("conference.bar.test.example.com", stanza)
            -- internal_room_jid_match_rewrite should return the stored value
            local result = M.internal_room_jid_match_rewrite("anything@" .. MUC_DOMAIN, stanza)
            assert.equal("conference.bar.test.example.com", result)
        end)
    end)

    -- -----------------------------------------------------------------------
    describe("table helpers", function()

        describe("table_shallow_copy", function()
            it("copies all key-value pairs", function()
                local orig = { a = 1, b = "x", c = true }
                local copy = M.table_shallow_copy(orig)
                assert.equal(1,     copy.a)
                assert.equal("x",   copy.b)
                assert.equal(true,  copy.c)
            end)

            it("returns a distinct table (not the same reference)", function()
                local orig = { x = 1 }
                local copy = M.table_shallow_copy(orig)
                assert.not_equal(orig, copy)
            end)

            it("does not deep-copy nested tables", function()
                local inner = { z = 9 }
                local orig  = { a = inner }
                local copy  = M.table_shallow_copy(orig)
                assert.equal(inner, copy.a)  -- same reference
            end)
        end)

        -- -------------------------------------------------------------------
        describe("table_find", function()
            it("returns the index of a found value", function()
                assert.equal(2, M.table_find({ "a", "b", "c" }, "b"))
            end)

            it("returns nil when value is not present", function()
                assert.is_nil(M.table_find({ "a", "b" }, "z"))
            end)

            it("returns nil for nil table", function()
                assert.is_nil(M.table_find(nil, "x"))
            end)

            it("returns nil when searching for nil", function()
                assert.is_nil(M.table_find({ "a", "b" }, nil))
            end)
        end)

        -- -------------------------------------------------------------------
        describe("table_add", function()
            it("appends all values from t2 onto t1", function()
                local t1 = { "a", "b" }
                local t2 = { "c", "d" }
                M.table_add(t1, t2)
                assert.same({ "a", "b", "c", "d" }, t1)
            end)

            it("leaves t1 unchanged when t2 is empty", function()
                local t1 = { "a" }
                M.table_add(t1, {})
                assert.same({ "a" }, t1)
            end)
        end)

        -- -------------------------------------------------------------------
        describe("table_compare", function()
            it("reports removed keys", function()
                local removed, added, modified = M.table_compare({ a = 1, b = 2 }, { a = 1 })
                assert.equal(1, #removed)
                assert.equal("b", removed[1])
                assert.equal(0, #added)
                assert.equal(0, #modified)
            end)

            it("reports added keys", function()
                local removed, added, modified = M.table_compare({ a = 1 }, { a = 1, b = 2 })
                assert.equal(0, #removed)
                assert.equal(1, #added)
                assert.equal("b", added[1])
                assert.equal(0, #modified)
            end)

            it("reports modified values", function()
                local removed, added, modified = M.table_compare({ a = 1 }, { a = 99 })
                assert.equal(0, #removed)
                assert.equal(0, #added)
                assert.equal(1, #modified)
                assert.equal("a", modified[1])
            end)

            it("returns three empty lists for identical tables", function()
                local removed, added, modified = M.table_compare({ x = 1 }, { x = 1 })
                assert.equal(0, #removed)
                assert.equal(0, #added)
                assert.equal(0, #modified)
            end)
        end)

        -- -------------------------------------------------------------------
        describe("table_equals", function()
            it("returns true for two identical tables", function()
                assert.is_true(M.table_equals({ a = 1, b = 2 }, { a = 1, b = 2 }))
            end)

            it("returns false when values differ", function()
                assert.is_false(M.table_equals({ a = 1 }, { a = 2 }))
            end)

            it("returns false when keys differ", function()
                assert.is_false(M.table_equals({ a = 1 }, { b = 1 }))
            end)

            it("returns true when both arguments are nil", function()
                assert.is_true(M.table_equals(nil, nil))
            end)

            it("returns false when only one argument is nil", function()
                assert.is_false(M.table_equals(nil, {}))
                assert.is_false(M.table_equals({}, nil))
            end)
        end)

    end) -- table helpers

    -- -----------------------------------------------------------------------
    describe("split_string", function()
        it("splits a simple comma-delimited string", function()
            local result = M.split_string("a,b,c", ",")
            assert.equal("a", result[1])
            assert.equal("b", result[2])
            assert.equal("c", result[3])
        end)

        it("produces a single element when delimiter is absent", function()
            local result = M.split_string("hello", ",")
            assert.equal("hello", result[1])
            assert.is_nil(result[2])
        end)

        it("produces empty strings at boundaries", function()
            local result = M.split_string(",a,", ",")
            assert.equal("",  result[1])
            assert.equal("a", result[2])
            assert.equal("",  result[3])
        end)

        it("handles multi-character delimiter", function()
            local result = M.split_string("x::y::z", "::")
            assert.equal("x", result[1])
            assert.equal("y", result[2])
            assert.equal("z", result[3])
        end)
    end)

    -- -----------------------------------------------------------------------
    describe("get_sip_jibri_email_prefix", function()
        it("returns nil for nil email", function()
            assert.is_nil(M.get_sip_jibri_email_prefix(nil))
        end)

        it("returns nil for unrecognised email", function()
            assert.is_nil(M.get_sip_jibri_email_prefix("user@example.com"))
        end)

        it("recognises outbound-sip-jibri@ prefix", function()
            assert.equal("outbound-sip-jibri@",
                M.get_sip_jibri_email_prefix("outbound-sip-jibri@example.com"))
        end)

        it("recognises sipjibriouta@ prefix", function()
            assert.equal("sipjibriouta@",
                M.get_sip_jibri_email_prefix("sipjibriouta@example.com"))
        end)

        it("recognises sipjibrioutb@ prefix", function()
            assert.equal("sipjibrioutb@",
                M.get_sip_jibri_email_prefix("sipjibrioutb@example.com"))
        end)

        it("recognises inbound-sip-jibri@ prefix", function()
            assert.equal("inbound-sip-jibri@",
                M.get_sip_jibri_email_prefix("inbound-sip-jibri@example.com"))
        end)

        it("recognises sipjibriina@ prefix", function()
            assert.equal("sipjibriina@",
                M.get_sip_jibri_email_prefix("sipjibriina@example.com"))
        end)
    end)

    -- -----------------------------------------------------------------------
    describe("is_jibri", function()
        it("returns truthy for recorder@ prefixed JID string", function()
            assert.is_truthy(M.is_jibri("recorder@recorder.example.com"))
        end)

        it("returns truthy for jibria@ prefixed JID string", function()
            assert.is_truthy(M.is_jibri("jibria@recorder.example.com"))
        end)

        it("returns truthy for jibrib@ prefixed JID string", function()
            assert.is_truthy(M.is_jibri("jibrib@recorder.example.com"))
        end)

        it("returns false for a non-recorder JID string", function()
            assert.is_false(M.is_jibri("user@example.com"))
        end)

        it("accepts an occupant object and inspects its .jid field", function()
            local occupant = { jid = "recorder@recorder.example.com" }
            assert.is_truthy(M.is_jibri(occupant))
        end)

        it("returns false for occupant object with non-recorder JID", function()
            local occupant = { jid = "user@example.com" }
            assert.is_false(M.is_jibri(occupant))
        end)
    end)

    -- -----------------------------------------------------------------------
    describe("is_transcriber", function()
        it("returns truthy for transcriber@ JID", function()
            assert.is_truthy(M.is_transcriber("transcriber@recorder.example.com"))
        end)

        it("returns truthy for transcribera@ JID", function()
            assert.is_truthy(M.is_transcriber("transcribera@recorder.example.com"))
        end)

        it("returns truthy for transcriberb@ JID", function()
            assert.is_truthy(M.is_transcriber("transcriberb@recorder.example.com"))
        end)

        it("returns false for a regular user JID", function()
            assert.is_false(M.is_transcriber("user@example.com"))
        end)

        it("returns false for nil", function()
            assert.is_false(M.is_transcriber(nil))
        end)
    end)

    -- -----------------------------------------------------------------------
    describe("is_vpaas", function()
        -- muc_domain = "conference.test.example.com" (derived from defaults)

        it("returns false for nil room", function()
            assert.is_false(M.is_vpaas(nil))
        end)

        it("returns true for a room whose tenant starts with vpaas-magic-cookie-", function()
            local room = { jid = "[vpaas-magic-cookie-xyz]myroom@" .. MUC_DOMAIN }
            assert.is_true(M.is_vpaas(room))
        end)

        it("caches the result in room.is_vpaas", function()
            local room = { jid = "[vpaas-magic-cookie-xyz]myroom@" .. MUC_DOMAIN }
            M.is_vpaas(room)
            assert.is_true(room.is_vpaas)
        end)

        it("returns false for a room on the wrong MUC domain", function()
            local room = { jid = "[vpaas-magic-cookie-xyz]myroom@other.domain.com" }
            assert.is_false(M.is_vpaas(room))
        end)

        it("returns false for a room without a tenant bracket prefix", function()
            local room = { jid = "myroom@" .. MUC_DOMAIN }
            assert.is_false(M.is_vpaas(room))
        end)

        it("returns false for a room whose tenant does not start with vpaas-magic-cookie-", function()
            local room = { jid = "[othertenant]myroom@" .. MUC_DOMAIN }
            assert.is_false(M.is_vpaas(room))
        end)

        it("returns cached is_vpaas value when present", function()
            local room = { jid = "[vpaas-magic-cookie-xyz]myroom@" .. MUC_DOMAIN, is_vpaas = false }
            -- Cached false should be returned without re-evaluating the JID
            assert.is_false(M.is_vpaas(room))
        end)
    end)

    -- -----------------------------------------------------------------------
    describe("is_moderated", function()
        -- moderated_subdomains = {"moderated-subdomain"}  (configured in stub)
        -- moderated_rooms      = {"moderatedroom"}

        it("returns true and room/subdomain for a moderated subdomain", function()
            local result, room_name, subdomain =
                M.is_moderated("[moderated-subdomain]someroom@" .. MUC_DOMAIN)
            assert.is_true(result)
            assert.equal("someroom", room_name)
            assert.equal("moderated-subdomain", subdomain)
        end)

        it("returns true and room name for a moderated room (no subdomain)", function()
            local result, room_name, subdomain =
                M.is_moderated("moderatedroom@" .. MUC_DOMAIN)
            assert.is_true(result)
            assert.equal("moderatedroom", room_name)
            assert.is_nil(subdomain)
        end)

        it("returns false for an unmoderated room with a subdomain", function()
            assert.is_false(M.is_moderated("[other-subdomain]room@" .. MUC_DOMAIN))
        end)

        it("returns false for an unmoderated room without a subdomain", function()
            assert.is_false(M.is_moderated("normalroom@" .. MUC_DOMAIN))
        end)
    end)

    describe("is_focus", function()

        it("nick ending in /focus returns true", function()
            assert.is_true(M.is_focus("room@conference.example.com/focus"))
        end)

        it("plain /focus string returns true", function()
            assert.is_true(M.is_focus("/focus"))
        end)

        it("regular nick returns false", function()
            assert.is_false(M.is_focus("room@conference.example.com/user1"))
        end)

        it("nick containing focus but not ending in /focus returns false", function()
            assert.is_false(M.is_focus("room@conference.example.com/focususer"))
        end)

        it("bare word focus without slash returns false", function()
            assert.is_false(M.is_focus("focus"))
        end)

        it("empty string returns false", function()
            assert.is_false(M.is_focus(""))
        end)

    end)

    describe("is_focus_nick", function()

        it("returns true for the bare string 'focus'", function()
            assert.is_true(M.is_focus_nick("focus"))
        end)

        it("returns false for a regular nick", function()
            assert.is_false(M.is_focus_nick("user1"))
        end)

        it("returns false for a nick that contains focus but is not exactly focus", function()
            assert.is_false(M.is_focus_nick("focususer"))
        end)

        it("returns false for a full MUC JID (slash-qualified)", function()
            assert.is_false(M.is_focus_nick("room@conference.example.com/focus"))
        end)

        it("returns false for empty string", function()
            assert.is_false(M.is_focus_nick(""))
        end)

    end)

    describe("is_focus_jid", function()

        it("returns true for focus@auth.example.com", function()
            assert.is_true(M.is_focus_jid("focus@auth.example.com"))
        end)

        it("returns true for focus@auth.example.com/resource", function()
            assert.is_true(M.is_focus_jid("focus@auth.example.com/res123"))
        end)

        it("returns false for a regular user JID", function()
            assert.is_false(M.is_focus_jid("user@auth.example.com"))
        end)

        it("returns false for JID whose node contains but is not exactly focus", function()
            assert.is_false(M.is_focus_jid("focususer@auth.example.com"))
        end)

        it("returns false for a host-only JID (no node)", function()
            assert.is_false(M.is_focus_jid("auth.example.com"))
        end)

        it("returns false for nil", function()
            assert.is_false(M.is_focus_jid(nil))
        end)

    end)

    describe("build_room_address", function()
        -- muc_domain_prefix = "conference" (set in module stub above)

        it("builds room JID with no subdomain", function()
            assert.equal("myroom@conference.example.com",
                M.build_room_address("myroom", "example.com", nil))
        end)

        it("prepends [subdomain] when subdomain is given", function()
            assert.equal("[tenant]myroom@conference.example.com",
                M.build_room_address("myroom", "example.com", "tenant"))
        end)

        it("treats empty-string subdomain as no subdomain", function()
            assert.equal("myroom@conference.example.com",
                M.build_room_address("myroom", "example.com", ""))
        end)

        it("uses the configured muc_domain_prefix (conference)", function()
            assert.equal("room@conference.meet.jit.si",
                M.build_room_address("room", "meet.jit.si", nil))
        end)

        it("combines subdomain with multi-part base domain", function()
            assert.equal("[vpaas-magic-cookie-abc]r@conference.meet.jit.si",
                M.build_room_address("r", "meet.jit.si", "vpaas-magic-cookie-abc"))
        end)

    end)

end) -- util.lib
