local otel = module:require "otel"
local jid = require "util.jid";

local exporter = otel.Exporter.new(module:get_option("otlp_endpoint"))
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

module:hook("muc-room-created", function(event)
    -- If the presence that created the room contains a traceparent extension,
    -- it will be used as parent for current span.
    local traceparent = find_tag(event.stanza.tags, "traceparent")

    tracer:start_span("muc.room-created", traceparent and traceparent.attr)
        :set_attribute("room.name", otel.Attribute.string(jid.node(event.room.jid)))
        :end_span()
end, -1)
