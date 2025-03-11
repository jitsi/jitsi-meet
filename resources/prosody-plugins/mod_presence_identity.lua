local stanza = require "util.stanza";
local update_presence_identity = module:require "util".update_presence_identity;

-- For all received presence messages, if the jitsi_meet_context_(user|group)
-- values are set in the session, then insert them into the presence messages
-- for that session.
function on_message(event)
    local stanza, session = event.stanza, event.origin;
    if stanza and session then
          update_presence_identity(
              stanza,
              session.jitsi_meet_context_user,
              session.jitsi_meet_context_group
          );
    end
end

module:hook("pre-presence/bare", on_message);
module:hook("pre-presence/full", on_message);
