local st = require "util.stanza";

-- A component which we use to receive all stanzas for the created poltergeists
-- replays with error if an iq is sent
function no_action()
	return true;
end

function error_reply(event)
	module:send(st.error_reply(event.stanza, "cancel", "service-unavailable"));
	return true;
end

module:hook("presence/host", no_action);
module:hook("message/host", no_action);
module:hook("presence/full", no_action);
module:hook("message/full", no_action);

module:hook("iq/host", error_reply);
module:hook("iq/full", error_reply);
module:hook("iq/bare", error_reply);
