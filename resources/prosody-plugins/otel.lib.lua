-- This opentelemetry library was inspired by https://github.com/yangxikun/opentelemetry-lua,
-- but simplified and adapted to the Prosody ecosystem.


local http = require "net.http"
local json = require "util.json"
local array = require "util.array"
local time = require "util.time"
local random = require "util.random"
local hex = require "util.hex"

local m = {}

--------------------------------------------------
--                    Util                      --
--------------------------------------------------

local function random_hex(n)
    return hex.to(random.bytes(n))
end
local function to_nanoseconds(t)
    return tostring(math.floor(t * 1e9))
end


--------------------------------------------------
--                  Attribute                   --
--------------------------------------------------

local Attribute = {}
m.Attribute = Attribute

function Attribute.string(value)
    return {
        string_value = value
    }
end

--------------------------------------------------
--                     Span                     --
--------------------------------------------------

local SpanStatus = {
    UNSET = 0,
    OK    = 1,
    ERROR = 2,
}

local SpanKind = {
    UNSPECIFIED = 0,
    INTERNAL    = 1,
    SERVER      = 2,
    CLIENT      = 3,
    PRODUCER    = 4,
    CONSUMER    = 5,
}

local Span = {}
Span.__index = Span
m.Span = Span

function Span.new(name, tracer, opts)
    local self = {
        name = name,
        tracer = tracer,
        parent = opts.parent,
        trace_id = opts.parent and opts.parent.trace_id or random_hex(16),
        span_id = random_hex(8),
        start_time = time.now(),
        attributes = array {},
    }

    return setmetatable(self, Span)
end

function Span:set_attribute(k, v)
    table.insert(self.attributes, { key = k, value = v })
    return self
end

function Span:end_span()
    self.end_time = time.now()
    self.tracer.processor:add(self)
end

function Span:encode()
    return {
        trace_id = self.trace_id,
        span_id = self.span_id,
        parent_span_id = self.parent and self.parent.parent_id,
        name = self.name,
        start_time_unix_nano = to_nanoseconds(self.start_time),
        end_time_unix_nano = to_nanoseconds(self.end_time),
        attributes = self.attributes,
        kind = self.kind or SpanKind.INTERNAL,
        status = {
            code = self.status or SpanStatus.OK
        }
    }
end

--------------------------------------------------
--                  Processor                   --
--------------------------------------------------

local Processor = {}
Processor.__index = Processor
m.Processor = Processor

function Processor.new(exporter)
    local self = {
        exporter = exporter
    }
    return setmetatable(self, Processor)
end

function Processor:add(span)
    self.exporter:export({ span })
end

--------------------------------------------------
--                   Exporter                   --
--------------------------------------------------

local Exporter = {}
Exporter.__index = Exporter
m.Exporter = Exporter

function Exporter.new(endpoint)
    local self = {
        endpoint = endpoint,
    }
    return setmetatable(self, Exporter)
end

function Exporter:export(spans)
    local body = {
        resource_spans = {
            {
                resource = spans[1].tracer.resource,
                scope_spans = {
                    {
                        scope = {
                            name = spans[1].tracer.name,
                        },
                        spans = {}
                    },
                },
            }
        }
    }


    for _, span in ipairs(spans) do
        table.insert(
            body.resource_spans[1].scope_spans[1].spans,
            span:encode()
        )
    end

    http.request(
        self.endpoint, {
            method = "POST",
            headers = {
                ["Content-Type"] = "application/json",
            },
            body = json.encode(body),
        },
        function(body, code, response)
            if code ~= 200 then
                module:log("error", json.encode(body))
            end
        end
    )
end

--------------------------------------------------
--                    Tracer                    --
--------------------------------------------------

local Tracer = {}
Tracer.__index = Tracer
m.Tracer = Tracer

function Tracer.new(processor, service, name)
    return setmetatable({
        processor = processor,
        resource = {
            attributes = {
                {
                    key = "service.name",
                    value = Attribute.string(service)
                }
            }
        },
        name = name,
    }, Tracer)
end

function Tracer:start_span(name, parent)
    return Span.new(name, self, { parent = parent })
end

return m
