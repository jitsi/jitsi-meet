local stanza = require "util.stanza";
local update_presence_identity = module:require "util".update_presence_identity;

-- For all received presence messages, if the jitsi_meet_context_(user|group)
-- values are set in the session, then insert them into the presence messages
-- for that session.
function on_message(event)
    if event and event["stanza"] then
      if event.origin then
          local user;
          local group;
          if event.origin.jitsi_meet_context_user then
              user = event.origin.jitsi_meet_context_user;
              group = event.origin.jitsi_meet_context_group;
          else
              user = { id = event.origin.username }; -- when using auth similar to internal_hashed
          end

          update_presence_identity(
              event.stanza,
              user,
              group
          );
      end
    end
end

module:hook("pre-presence/bare", on_message);
module:hook("pre-presence/full", on_message);
