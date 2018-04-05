local ext_events = module:require "ext_events"
local jid = require "util.jid"

-- Options and configuration
local poltergeist_component = module:get_option_string(
   "poltergeist_component",
   module.host
);
local muc_domain_base = module:get_option_string("muc_mapper_domain_base");
if not muc_domain_base then
   module:log(
	  "warn",
	  "No 'muc_domain_base' option set, unable to send call events."
   );
   return
end

-- Status strings that trigger call events.
local invited_status = "Invited"

-- url_from_room_jid will determine the url for a conference
-- provided a room jid. It is required that muc domain mapping
-- is enabled and configured. There are two url formats that are supported.
-- The following urls are examples of the supported formats.
--     https://meet.jit.si/jitsi/ProductiveMeeting
--     https://meet.jit.si/MoreProductiveMeeting
-- The urls are derived from portions of the room jid.
local function url_from_room_jid(room_jid)
   local node, _, _ = jid.split(room_jid)
   if not node then return nil end

   local target_subdomain, target_node = node:match("^%[([^%]]+)%](.+)$")

   if not(target_node or target_subdomain) then
	  return "https://"..muc_domain_base.."/"..node
   else
	  return
		 "https://"..muc_domain_base.."/"..target_subdomain.."/"..target_node
   end
end

-- Listening for all muc presences stanza events. If a presence stanza is from
-- a poltergeist then it will be further processed to determine if a call
-- event should be triggered. Call events are triggered by status strings
-- the status strings supported are:
--    -------------------------
--    Status     | Event Type
--    _________________________
--    "Invited"  | Invite
module:hook("muc-broadcast-presence", function (event)
    -- Detect if the presence is for a poltergeist or not.
    if not
	   (jid.bare(event.occupant.jid) == poltergeist_component)
	   or
	   event.stanza == nil
	then
	   return
    end

    if event.stanza:get_child_text("status") == invited_status then
	   local url = assert(url_from_room_jid(event.stanza.attr.from))
	   ext_events.invite(event.stanza, url)
    end
end, -101);
