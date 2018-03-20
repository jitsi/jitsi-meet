local stanza = require "util.stanza";

-- For all received presence messages, if the jitsi_meet_context_(user|group)
-- values are set in the session, then insert them into the presence messages
-- for that session.
function on_message(event)
    if event and event["stanza"] then
      if event.origin and event.origin.jitsi_meet_context_user then
          -- First remove any 'identity' element if it already
          -- exists
          event.stanza:maptags(
              function(tag)
                  for k, v in pairs(tag) do
                      if k == "name" and v == "identity" then
                          return nil
                      end
                  end
                  return tag
              end
          )
          module:log("debug", "Presence after previous identity stripped: %s", tostring(event.stanza))

          event.stanza:tag("identity"):tag("user")
          for k, v in pairs(event.origin.jitsi_meet_context_user) do
              event.stanza:tag(k):text(v):up()
          end
          event.stanza:up()
            
          -- Add the group information if it is present
          if event.origin.jitsi_meet_context_group then
              event.stanza:tag("group"):text(event.origin.jitsi_meet_context_group)
          end

          module:log("debug", "Sending presence with identity inserted %s", tostring(event.stanza))
      end
    end
end

module:hook("pre-presence/bare", on_message);
module:hook("pre-presence/full", on_message);
