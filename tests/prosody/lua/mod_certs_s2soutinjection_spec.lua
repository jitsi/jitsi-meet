-- Unit tests for mod_certs_s2soutinjection.lua
-- Run with busted from resources/prosody-plugins/:
--   busted spec/lua/
--
-- No Prosody installation required — all dependencies are stubbed.
-- The module exposes a global `attach` function that is called directly.

-- ---------------------------------------------------------------------------
-- Helper: load the module with given option values
--
-- Returns attach, wrapped_events table so callers can inspect both.
-- ---------------------------------------------------------------------------

local function load_module(options)
    options = options or {}

    local wrapped_events = {}

    local mod = {
        set_global  = function() end,
        get_option  = function(_, key) return options[key] end,
        wrap_event  = function(_, event_name, handler)
            wrapped_events[event_name] = handler
        end,
        log         = function() end,
    }

    _G.module = mod
    _G.attach = nil  -- reset from any previous load

    local ok, err = pcall(dofile, "mod_certs_s2soutinjection.lua")
    assert(ok, "module load failed: " .. tostring(err))

    return _G.attach, wrapped_events
end

-- ---------------------------------------------------------------------------
-- Tests
-- ---------------------------------------------------------------------------

describe("mod_certs_s2soutinjection", function()

    -- -----------------------------------------------------------------------
    describe("attach()", function()

        it("marks cert valid when host is in s2s_connect_overrides", function()
            local attach = load_module({
                s2s_connect_overrides = { ["bridge.example.com"] = "10.0.0.1:5269" },
            })

            local session = {}
            local result  = attach({ session = session, host = "bridge.example.com" })

            assert.equal("valid", session.cert_chain_status)
            assert.equal("valid", session.cert_identity_status)
            assert.is_true(result)
        end)

        it("does not touch cert status for host not in overrides", function()
            local attach = load_module({
                s2s_connect_overrides = { ["bridge.example.com"] = "10.0.0.1:5269" },
            })

            local session = {}
            local result  = attach({ session = session, host = "other.example.com" })

            assert.is_nil(session.cert_chain_status)
            assert.is_nil(session.cert_identity_status)
            assert.is_falsy(result)
        end)

        it("returns falsy and does not error when no overrides configured", function()
            local attach = load_module({})

            local session = {}
            local result  = attach({ session = session, host = "bridge.example.com" })

            assert.is_nil(session.cert_chain_status)
            assert.is_falsy(result)
        end)

        it("falls back to s2sout_override when s2s_connect_overrides is absent", function()
            local attach = load_module({
                s2sout_override = { ["bridge.example.com"] = "10.0.0.1:5269" },
            })

            local session = {}
            local result  = attach({ session = session, host = "bridge.example.com" })

            assert.equal("valid", session.cert_chain_status)
            assert.equal("valid", session.cert_identity_status)
            assert.is_true(result)
        end)

        it("prefers s2s_connect_overrides — s2sout_override hosts are ignored", function()
            local attach = load_module({
                s2s_connect_overrides = { ["bridge.example.com"] = "10.0.0.1:5269" },
                s2sout_override       = { ["legacy.example.com"] = "10.0.0.2:5269" },
            })

            -- host only in s2s_connect_overrides → valid
            local s1 = {}
            attach({ session = s1, host = "bridge.example.com" })
            assert.equal("valid", s1.cert_chain_status)

            -- host only in s2sout_override (legacy, ignored when primary present) → not set
            local s2 = {}
            attach({ session = s2, host = "legacy.example.com" })
            assert.is_nil(s2.cert_chain_status)
        end)

        it("handles multiple hosts in override map independently", function()
            local attach = load_module({
                s2s_connect_overrides = {
                    ["bridge1.example.com"] = "10.0.0.1:5269",
                    ["bridge2.example.com"] = "10.0.0.2:5269",
                },
            })

            local s1 = {}
            attach({ session = s1, host = "bridge1.example.com" })
            assert.equal("valid", s1.cert_chain_status)

            local s2 = {}
            attach({ session = s2, host = "bridge2.example.com" })
            assert.equal("valid", s2.cert_chain_status)

            local s3 = {}
            attach({ session = s3, host = "unlisted.example.com" })
            assert.is_nil(s3.cert_chain_status)
        end)

    end) -- attach()

    -- -----------------------------------------------------------------------
    describe("event wrapping", function()

        it("registers handler on s2s-check-certificate event", function()
            local _, wrapped = load_module({})
            assert.is_function(wrapped["s2s-check-certificate"])
        end)

        it("wrapped handler delegates to attach and returns its result", function()
            local _, wrapped = load_module({
                s2s_connect_overrides = { ["bridge.example.com"] = "10.0.0.1" },
            })

            local session = {}
            local handler = wrapped["s2s-check-certificate"]
            -- handler signature: (handlers, event_name, event_data)
            local result  = handler(nil, "s2s-check-certificate",
                                    { session = session, host = "bridge.example.com" })

            assert.equal("valid", session.cert_chain_status)
            assert.is_true(result)
        end)

    end) -- event wrapping

end)
