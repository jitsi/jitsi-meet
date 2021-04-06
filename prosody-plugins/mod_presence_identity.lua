local stanza = require "util.stanza";
local update_presence_identity = module:require "util".update_presence_identity;

-- For all received presence messages, if the jitsi_meet_context_(user|group)
-- values are set in the session, then insert them into the presence messages
-- for that session.
function on_message(event)
    if event and event["stanza"] then
      if event.origin and event.origin.jitsi_meet_context_user then

          update_presence_identity(
              event.stanza,
              event.origin.jitsi_meet_context_user,
              event.origin.jitsi_meet_context_group
          );

      end
    end
end

module:hook("pre-presence/bare", on_message);
module:hook("pre-presence/full", on_message);
