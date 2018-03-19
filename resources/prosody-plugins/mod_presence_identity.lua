local stanza = require "util.stanza";
local core_post_stanza = prosody.core_post_stanza;

-- For all received presence messages, if the jitsi_meet_context_(user|group)
-- values are set in the session, then insert them into the presence messages
-- for that session.
function on_message(event)
    if event["stanza"] then
      local presence = event["stanza"]
      if event.origin["jitsi_meet_context_user"] then
          local new_stanza = stanza.clone(event.stanza)
          -- First remove any 'identity' element if it already
          -- exists
          new_stanza:maptags(
              function(tag)
                  for k, v in pairs(tag) do
                      if k == "name" and v == "identity" then
                          module:log("debug", "filtering out 'identity' field")
                          return nil
                      end
                  end
                  return tag
              end
          )
          new_stanza:tag("identity"):tag("user")
          for k, v in pairs(event.origin["jitsi_meet_context_user"]) do
              new_stanza:tag(k):text(v):up()
          end
          new_stanza:up()
          new_stanza:tag("group"):text(event.origin["jitsi_meet_context_group"])

          module:log("debug", "Sending presence with identity inserted %s", tostring(new_stanza))
          core_post_stanza(event.origin, new_stanza)
      end
    end
    return true
end

module:hook("pre-presence/bare", on_message);
module:hook("pre-presence/full", on_message);
