-- Unit tests for otel.lib.lua
-- Run with busted from resources/prosody-plugins/:
--   busted spec/lua/
-- Requires: lua-cjson
--
-- Stubs every Prosody dependency so no Prosody installation is needed.

local os = require "os"
local cjson = require "cjson"

-- We save the request body to compare it later.
local latest_request = nil
package.preload['net.http'] = function()
    return {
        request = function(endpoint, args)
            latest_request = args
        end
    }
end

package.preload['util.json'] = function()
    return {
        encode = function(x)
            return cjson.encode(x)
        end
    }
end
package.preload['util.array'] = function()
    return function(t) return t end
end
package.preload['util.time'] = function()
    return {
        now = function()
            return os.time();
        end
    }
end
package.preload['util.random'] = function()
    return {
        bytes = function(n)
            local out = {}
            for i = 1, n do
                out[i] = string.char(math.random(0, 255))
            end
            return table.concat(out)
        end
    }
end
package.preload['util.hex'] = function()
    return {
        to = function(bytes)
            local out = {}
            for i = 1, #bytes do
                out[i] = string.format("%02x", bytes:byte(i))
            end
            return table.concat(out)
        end
    }
end


-- Guard: skip the whole suite if the module's hard dependencies aren't installed.
local ok, M = pcall(dofile, "otel.lib.lua")
if not ok then
    describe("otel", function()
        it("skipped", function()
            pending(tostring(M):match("([^\n]+)"))
        end)
    end)
    return
end

describe("otel", function()
    describe("span", function()
        it("create and export span", function()
            local exporter = M.Exporter.new("endpoint")
            local processor = M.Processor.new(exporter)
            local tracer = M.Tracer.new(processor, "service", "scope")

            local span = M.Span.new("name", tracer, {})
            span:set_attribute("key", M.Attribute.string("value"))
            span:end_span()

            local body = cjson.decode(latest_request.body)
            assert.are.same(
                {
                    attributes = {
                        { key = "service.name", value = { string_value = "service" } }
                    }
                },
                body.resource_spans[1].resource)
            assert.are.same(
                {
                    name = "scope"
                },
                body.resource_spans[1].scope_spans[1].scope
            )

            local span = body.resource_spans[1].scope_spans[1].spans[1]
            assert.are.same(
                { { key = "key", value = { string_value = "value" } } },
                span.attributes
            )

            assert.are.same(1, span.kind)
            assert.are.same("name", span.name)
            assert.are.same({ code = 1 }, span.status)
        end)
    end)
end) -- otel
