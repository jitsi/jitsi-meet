-- MUC Max Occupants
-- Configuring muc_max_occupants will set a limit of the maximum number
-- of participants that will be able to join in a room.
-- Participants in muc_access_whitelist will not be counted for the
-- max occupants value (values are jids like recorder@jitsi.meeet.example.com).
-- This module is configured under the muc component that is used for jitsi-meet
local split_jid = require "util.jid".split;
local st = require "util.stanza";
local it = require "util.iterators";
local is_healthcheck_room = module:require "util".is_healthcheck_room;

local whitelist = module:get_option_set("muc_access_whitelist");
local MAX_OCCUPANTS = module:get_option_number("muc_max_occupants", -1);

local function count_keys(t)
  return it.count(it.keys(t));
end

local function check_for_max_occupants(event)
  local room, origin, stanza = event.room, event.origin, event.stanza;
  local user, domain, res = split_jid(stanza.attr.from);

  if is_healthcheck_room(room.jid) then
    return;
  end

  --no user object means no way to check for max occupants
  if user == nil then
    return
  end
  -- If we're a whitelisted user joining the room, don't bother checking the max
  -- occupants.
  if whitelist and (whitelist:contains(domain) or whitelist:contains(user..'@'..domain)) then
    return;
  end

	if room and not room._jid_nick[stanza.attr.from] then
        local max_occupants_by_room = event.room._data.max_occupants;
		local count = count_keys(room._occupants);
        -- if no of occupants limit is set per room basis use
        -- that settings otherwise use the global one
        local slots = max_occupants_by_room or MAX_OCCUPANTS;

		-- If there is no whitelist, just check the count.
		if not whitelist and count >= slots then
			module:log("info", "Attempt to enter a maxed out MUC");
			origin.send(st.error_reply(stanza, "cancel", "service-unavailable"));
			return true;
		end

		-- TODO: Are Prosody hooks atomic, or is this a race condition?
		-- For each person in the room that's not on the whitelist, subtract one
		-- from the count.
		for _, occupant in room:each_occupant() do
			user, domain, res = split_jid(occupant.bare_jid);
			if not whitelist or (not whitelist:contains(domain) and not whitelist:contains(user..'@'..domain)) then
				slots = slots - 1
			end
		end

		-- If the room is full (<0 slots left), error out.
		if slots <= 0 then
			module:log("info", "Attempt to enter a maxed out MUC");
			origin.send(st.error_reply(stanza, "cancel", "service-unavailable"));
			return true;
		end
	end
end

if MAX_OCCUPANTS > 0 then
	module:hook("muc-occupant-pre-join", check_for_max_occupants, 10);
end
