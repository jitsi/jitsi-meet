-- Unit tests for mod_debug_traceback.lua
-- Run with busted from resources/prosody-plugins/:
--   busted spec/lua/
--
-- No Prosody installation required — all dependencies are stubbed.
-- The module exposes a global `dump_traceback` function that is called directly.

-- ---------------------------------------------------------------------------
-- Package preloads (must be registered before any dofile() call)
-- ---------------------------------------------------------------------------

package.preload['util.debug'] = function()
    return { traceback = function() return "fake traceback\nframe 1\nframe 2" end }
end

package.preload['util.pposix'] = function()
    return { getpid = function() return 99 end }
end

-- Minimal interpolation stub: substitutes {key} and {key.subkey} tokens.
-- Filters (yyyymmdd, hhmmss) are invoked when the key matches.
package.preload['util.interpolation'] = function()
    return {
        new = function(_, _, filters)
            return function(template, vars)
                return (template:gsub('{([^}]+)}', function(key)
                    -- Try filters first (yyyymmdd, hhmmss, ...)
                    if filters and filters[key] and vars.time then
                        return tostring(filters[key](vars.time))
                    end
                    -- Nested key lookup (e.g. paths.data)
                    local val = vars
                    for part in key:gmatch('[^%.]+') do
                        if type(val) == 'table' then val = val[part]
                        else val = nil; break end
                    end
                    return val ~= nil and tostring(val) or ('{' .. key .. '}')
                end))
            end
        end,
    }
end

-- util.signal is required when mod_posix lacks signal_events support
package.preload['util.signal'] = function()
    return { signal = function() end }
end

-- ---------------------------------------------------------------------------
-- Prosody global required by get_filename (prosody.paths.data)
-- ---------------------------------------------------------------------------

_G.prosody = { paths = { data = "/tmp/prosody-test" } }

-- ---------------------------------------------------------------------------
-- Helper: load module with given option overrides
--
-- Returns: dump_traceback fn, log_calls list, fired_events list
-- ---------------------------------------------------------------------------

local function load_module(options)
    options = options or {}
    local log_calls    = {}
    local fired_events = {}

    local mod = {
        set_global        = function() end,
        get_option_string = function(_, key, default)
            local v = options[key]
            return v ~= nil and v or default
        end,
        log = function(_, level, fmt, ...)
            local ok, msg = pcall(string.format, fmt, ...)
            table.insert(log_calls, { level = level, msg = ok and msg or fmt })
        end,
        fire_event = function(_, name, data)
            table.insert(fired_events, { name = name, data = data })
        end,
        depends    = function() return {} end,  -- no features.signal_events → util.signal path
        hook       = function() end,
        wrap_event = function() end,
    }

    _G.module         = mod
    _G.dump_traceback = nil

    local ok, err = pcall(dofile, "mod_debug_traceback.lua")
    assert(ok, "module load failed: " .. tostring(err))

    return _G.dump_traceback, log_calls, fired_events
end

-- ---------------------------------------------------------------------------
-- io.open helpers
-- ---------------------------------------------------------------------------

-- Replace io.open for the duration of fn(); collect written content per path.
local function with_mock_io(files_written, fn)
    local orig = io.open
    io.open = function(path, _mode)
        local buf = {}
        files_written[path] = buf
        return {
            write = function(_, s) buf[#buf + 1] = s end,
            close = function() end,
        }
    end
    fn()
    io.open = orig
end

-- Replace io.open with one that always fails.
local function with_failing_io(fn)
    local orig = io.open
    io.open = function() return nil, "permission denied" end
    fn()
    io.open = orig
end

-- ---------------------------------------------------------------------------
-- Tests
-- ---------------------------------------------------------------------------

describe("mod_debug_traceback", function()

    -- -----------------------------------------------------------------------
    describe("dump_traceback()", function()

        it("writes traceback content to file", function()
            local dump = load_module()
            local files = {}
            with_mock_io(files, function() dump() end)

            local path    = next(files)
            local content = table.concat(files[path])
            assert.is_truthy(content:find("fake traceback", 1, true))
        end)

        it("surrounds traceback with header and footer lines", function()
            local dump = load_module()
            local files = {}
            with_mock_io(files, function() dump() end)

            local content = table.concat(files[next(files)])
            assert.is_truthy(content:find("-- Traceback generated at", 1, true))
            assert.is_truthy(content:find("-- End of traceback --",   1, true))
        end)

        it("fires debug_traceback/triggered event with a traceback string", function()
            local dump, _, events = load_module()
            local files = {}
            with_mock_io(files, function() dump() end)

            assert.equal(1, #events)
            assert.equal("debug_traceback/triggered", events[1].name)
            assert.is_string(events[1].data.traceback)
        end)

        it("fires event before attempting file write (even on io failure)", function()
            local dump, _, events = load_module()
            with_failing_io(function() dump() end)

            assert.equal(1, #events)
            assert.equal("debug_traceback/triggered", events[1].name)
        end)

        it("logs an error when the file cannot be opened", function()
            local dump, log_calls = load_module()
            with_failing_io(function() dump() end)

            local found = false
            for _, e in ipairs(log_calls) do
                if e.level == "error" and e.msg:find("permission denied", 1, true) then
                    found = true
                end
            end
            assert.is_true(found, "expected error log mentioning 'permission denied'")
        end)

        it("does not write a file when io.open fails", function()
            local dump = load_module()
            local files = {}
            with_failing_io(function() dump() end)
            -- files table should remain empty (no successful open)
            assert.is_nil(next(files))
        end)

        it("default filename contains pid and starts with data path", function()
            local dump = load_module()
            local files = {}
            with_mock_io(files, function() dump() end)

            local path = next(files)
            assert.is_truthy(path:find("/tmp/prosody-test", 1, true))
            assert.is_truthy(path:find("99", 1, true))  -- pid = 99
        end)

        it("default filename embeds count (starting at 0)", function()
            local dump = load_module()
            local files = {}
            with_mock_io(files, function() dump() end)

            local path = next(files)
            -- default template: traceback-{pid}-{count}.log → count=0 on first call
            assert.is_truthy(path:find("%-0%.log$"))
        end)

        it("increments count between calls producing distinct filenames", function()
            local dump = load_module()
            local paths = {}
            local orig  = io.open
            io.open = function(path, _)
                paths[#paths + 1] = path
                return { write = function() end, close = function() end }
            end
            dump()
            dump()
            io.open = orig

            assert.equal(2, #paths)
            assert.not_equal(paths[1], paths[2])
        end)

        it("uses custom signal name in info log message", function()
            local dump, log_calls = load_module({ debug_traceback_signal = "SIGUSR2" })
            local files = {}
            with_mock_io(files, function() dump() end)

            local found = false
            for _, e in ipairs(log_calls) do
                if e.level == "info" and e.msg:find("SIGUSR2", 1, true) then
                    found = true
                end
            end
            assert.is_true(found, "expected info log mentioning 'SIGUSR2'")
        end)

        it("uses custom filename template from config", function()
            local dump = load_module({
                debug_traceback_filename = "/custom/tb-{pid}.log",
            })
            local files = {}
            with_mock_io(files, function() dump() end)

            local path = next(files)
            assert.equal("/custom/tb-99.log", path)
        end)

    end) -- dump_traceback()

end)
