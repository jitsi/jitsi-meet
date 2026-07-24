local otel = module:require "otel"
local jid = require "util.jid";
local json = require "util.json";

local otlp_endpoint = module:get_option("otlp_endpoint")

if not otlp_endpoint then
  module:log("warn", "module disabled: otlp_endpoint unset")
  return
end

local exporter = otel.Exporter.new(otlp_endpoint)
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

module:hook("iq/full", function(event)
  local iq_element = event.stanza.tags[1]
  if not iq_element then
    return
  end

  if iq_element.name ~= "conference-modify" or iq_element.attr.xmlns ~= "jitsi:colibri2" then
    return
  end

  local traceparent = find_tag(iq_element.tags, "traceparent")
  if not traceparent then
    return
  end

  local span = tracer:start_span("colibri.conference-modify", {
    trace_id = traceparent.attr.trace_id,
    parent_id = traceparent.attr.parent_id,
  })
  span:end_span()

  traceparent.attr.parent_id = span.span_id
end, -1)

