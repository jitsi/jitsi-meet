module:set_global()

local filters = require"util.filters";

local stanzas_in = module:metric(
	"counter", "received", "",
	"Stanzas received by Prosody",
	{ "session_type", "stanza_kind" }
)
local stanzas_out = module:metric(
	"counter", "sent", "",
	"Stanzas sent by prosody",
	{ "session_type", "stanza_kind" }
)

local stanza_kinds = { message = true, presence = true, iq = true };

local function rate(metric_family)
	return function (stanza, session)
		if stanza.attr and not stanza.attr.xmlns and stanza_kinds[stanza.name] then
			metric_family:with_labels(session.type, stanza.name):add(1);
		end
		return stanza;
	end
end

local function measure_stanza_counts(session)
	filters.add_filter(session, "stanzas/in",  rate(stanzas_in));
	filters.add_filter(session, "stanzas/out", rate(stanzas_out));
end

filters.add_filter_hook(measure_stanza_counts);
