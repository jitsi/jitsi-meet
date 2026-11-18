-- Unit tests for token/room_pattern.lib.lua
-- Run with busted from resources/prosody-plugins/:
--   busted ../../tests/prosody/lua/
--
-- The library has no Prosody dependencies. dofile resolves relative to CWD,
-- so run from resources/prosody-plugins/.
--
-- The integration tests in mod_auth_token_asap_spec.js cover the use of the
-- matcher in verify_room(). These tests cover the matcher itself: which
-- patterns it accepts, what they match, and that its time stays linear.

local M = dofile("token/room_pattern.lib.lua")
local match = M.match

describe("token/room_pattern", function()

    describe("accepted patterns", function()
        -- { pattern, room, expected }
        local cases = {
            -- one '.*' at the end: a prefix match
            { "team_42.*", "team_42", true },
            { "team_42.*", "team_42_standup", true },
            { "team_42.*", "team_420", true },
            { "team_42.*", "myteam_42", false },
            { "team_42.*", "team_4", false },

            -- one '.*' at the start: a suffix match
            { ".*_standup", "team_42_standup", true },
            { ".*_standup", "team_42_standup_2", false },

            -- one '.*' in the middle: a prefix and a suffix
            { "team_.*_standup", "team_42_standup", true },
            { "team_.*_standup", "team__standup", true },
            { "team_.*_standup", "team_standup", false },
            { "ab.*b", "ab", false },
            { "ab.*b", "abb", true },

            -- only '.*': any room
            { ".*", "", true },
            { ".*", "anything", true },

            -- no '.*': a literal match
            { "abc", "abc", true },
            { "abc", "abcd", false },
            { "abc", "ab", false },
            { "", "", true },
            { "", "x", false },

            -- bytes are compared as they are
            { "a\0b", "a\0b", true },
            { "a.*b", "a\0\0b", true },
            { "caf\195\169.*", "caf\195\169x", true },
            { "CAF.*", "cafx", false },
        }

        for _, c in ipairs(cases) do
            local pattern, room, expected = c[1], c[2], c[3]
            it(string.format("%q against %q is %s", pattern, room, tostring(expected)), function()
                local result, reason = match(pattern, room)
                assert.is_nil(reason)
                assert.equal(expected, result)
            end)
        end
    end)

    describe("refused patterns", function()
        local patterns = {
            "a.*.*", "a.*b.*", ".*.*", "..*", ".**", "*.*",
            "a*", "*", "a.b", "a%d", "a-b", "(x", "x)", "[a]", "a+", "a?", "^a", "a$",
        }

        for _, pattern in ipairs(patterns) do
            it(string.format("%q is refused", pattern), function()
                local result, reason = match(pattern, "a")
                assert.is_nil(result)
                assert.equal("more than one .* or another special character", reason)
            end)
        end

        it("refuses a pattern that is not a string", function()
            for _, pattern in ipairs({ 123, true, {} }) do
                local result, reason = match(pattern, "a")
                assert.is_nil(result)
                assert.equal("not a string", reason)
            end
            local result, reason = match(nil, "a")
            assert.is_nil(result)
            assert.equal("not a string", reason)
        end)
    end)

    describe("time", function()
        -- A Lua pattern such as 'a*a*a*a*%d' over a long run of 'a's takes
        -- seconds. The matcher must stay linear, so one megabyte on each side
        -- must take well under one second.
        local big = string.rep("a", 1000000)

        local function under_one_second(f)
            local start = os.clock()
            local result = f()
            local elapsed = os.clock() - start
            assert.is_true(elapsed < 1, string.format("took %.2fs", elapsed))
            return result
        end

        it("matches a 1MB room against a 1MB prefix and suffix", function()
            assert.is_true(under_one_second(function()
                return match(big .. ".*" .. big, big .. "zzz" .. big)
            end))
        end)

        it("matches a 1MB literal", function()
            assert.is_true(under_one_second(function()
                return match(big, big)
            end))
        end)

        it("refuses 1MB of special characters", function()
            assert.is_nil(under_one_second(function()
                return match(string.rep("%", 1000000), big)
            end))
        end)

        it("refuses 1MB of dots", function()
            assert.is_nil(under_one_second(function()
                return match(string.rep(".", 1000000), big)
            end))
        end)
    end)
end)
