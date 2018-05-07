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
local invited_status  = "Invited"
local calling_status  = "Calling"
local ringing_status  = "Ringing"
local busy_status     = "Busy"
local rejected_status = "Rejected"
local connected_status = "connected"



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
--    Status      | Event Type
--    _________________________
--    "Calling"   | INVITE
--    "Invited"   | INVITE
--    "Ringing"   | CANCEL
--    "Busy"      | CANCEL
--    "Rejected"  | CANCEL
--    "connected" | CANCEL
module:hook("muc-broadcast-presence", function (event)
    -- Detect if the presence is for a poltergeist or not.
    if not
	   (jid.bare(event.occupant.jid) == poltergeist_component)
	   or
	   event.stanza == nil
	then
	   return
    end

	local invite = function()
		 local url = assert(url_from_room_jid(event.stanza.attr.from))
		 ext_events.invite(event.stanza, url)
	end

	local cancel = function()
	   local url = assert(url_from_room_jid(event.stanza.attr.from))
	   local status = event.stanza:get_child_text("status")
	   ext_events.cancel(event.stanza, url, string.lower(status))
	end

	local switch = function(status)
	   case = {
		  [invited_status]   = function() invite() end,
		  [calling_status]   = function() invite() end,
		  [ringing_status]   = function() cancel() end,
		  [busy_status]      = function() cancel() end,
		  [rejected_status]  = function() cancel() end,
		  [connected_status] = function() cancel() end
	   }
	   if case[status] then case[status]() end
	end

	switch(event.stanza:get_child_text("status"))
end, -101);
