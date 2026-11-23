local otel = module:require "otel"
local http = require "net.http"

local otlp_endpoint = module:get_option("otlp_endpoint")

if not otlp_endpoint then
    module:log("warn", "module disabled: otlp_endpoint unset")
    return
end

local exporter = otel.Exporter.new(http.request, otlp_endpoint)
local processor = otel.Processor.new(exporter)
local tracer = otel.Tracer.new(processor, "prosody", "muc")

local function find_tag(tags, name)
    for _, tag in ipairs(tags) do
        if tag.name == name then
            return tag
        end
    end
    return nil
end

-- Records a hop span for a stanza carrying a <traceparent/> child element
-- and rewrites its parent_id so the receiving service parents under this
-- span.
local function trace_element(span_name, traceparent)
    local span = tracer:start_span(span_name, {
        trace_id = traceparent.attr.trace_id,
        span_id = traceparent.attr.parent_id,
    })
    span:end_span()

    traceparent.attr.parent_id = span.span_id
end

-- Records a hop span for a Rayo dial IQ. The trace context arrives either
-- as a <traceparent/> element (as on colibri IQs), or as an X-Traceparent
-- Rayo header holding a W3C trace context value
-- ("00-<trace-id>-<parent-id>-<flags>"), which is the form jigasi consumes.
local function trace_dial(dial)
    local traceparent = find_tag(dial.tags, "traceparent")
    if traceparent then
        trace_element("rayo.dial", traceparent)
        return
    end

    for _, tag in ipairs(dial.tags) do
        if tag.name == "header" and tag.attr.name == "X-Traceparent" then
            local trace_id, parent_id, flags = string.match(
                tag.attr.value or "", "^00%-(%x+)%-(%x+)%-(%x+)$")
            if trace_id and #trace_id == 32 and #parent_id == 16 then
                local span = tracer:start_span("rayo.dial", {
                    trace_id = trace_id,
                    span_id = parent_id,
                })
                span:end_span()

                tag.attr.value =
                    "00-" .. trace_id .. "-" .. span.span_id .. "-" .. flags
            end
            return
        end
    end
end

module:hook("iq/full", function(event)
    local iq_element = event.stanza.tags[1]
    if not iq_element then
        return
    end

    if iq_element.name == "conference-modify" and iq_element.attr.xmlns == "jitsi:colibri2" then
        local traceparent = find_tag(iq_element.tags, "traceparent")
        if traceparent then
            trace_element("colibri.conference-modify", traceparent)
        end
    elseif iq_element.name == "dial" and iq_element.attr.xmlns == "urn:xmpp:rayo:1" then
        trace_dial(iq_element)
    end
end, 1)
