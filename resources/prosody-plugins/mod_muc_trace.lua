local otel = module:requie "otel"
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
	local traceparent = find_tag(event.stanza.tags, "traceparent")
	local span = tracer:start_span("muc.room-created", traceparent and traceparent.attr)
			:set_attribute("room.name", otel.Attribute.string(jid.node(event.room.jid)))
	span:end_span()
end, -1)
