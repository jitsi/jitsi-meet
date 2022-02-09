--This module adds is_hidden tag when the user from jwt is moderator and when
--jwt contains `hidden` flag set to true, or removes it in case it was
--added maliciously from client sent presence.
--The module must be enabled under the muc component.
local is_user_hidden = module:require "util".is_user_hidden;
local tag_name = "is_hidden"

module:log("info", "Loading mod_muc_user_hidden!");

function add_hidden_tag(event)
    local stanza = event.stanza;
    local session = event.origin;

    if stanza == nil or stanza.name ~= "presence" then
      return
    end

    stanza:maptags(function(tag)
      if tag and tag.name == tag_name then
          module:log("info", "Removing %s tag from presence stanza!", tag_name);
          return nil;
      else
          return tag;
      end
    end)

    if is_user_hidden(session) then
        stanza:tag(tag_name):up()
    end
end

module:hook("presence/bare", add_hidden_tag);
module:hook("presence/full", add_hidden_tag);
module:hook("presence/host", add_hidden_tag);

module:log("info", "Loaded mod_muc_user_hidden!");