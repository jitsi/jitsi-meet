local mark_storage = module:open_store("firewall_marks");
local mark_map_storage = module:open_store("firewall_marks", "map");

local user_sessions = prosody.hosts[module.host].sessions;

module:hook("firewall/marked/user", function (event)
	local user = user_sessions[event.username];
	local marks = user and user.firewall_marks;
	if user and not marks then
		-- Load marks from storage to cache on the user object
		marks = mark_storage:get(event.username) or {};
		user.firewall_marks = marks; --luacheck: ignore 122
	end
	if marks then
		marks[event.mark] = event.timestamp;
	end
	local ok, err = mark_map_storage:set(event.username, event.mark, event.timestamp);
	if not ok then
		module:log("error", "Failed to mark user %q with %q: %s", event.username, event.mark, err);
	end
	return true;
end, -1);

module:hook("firewall/unmarked/user", function (event)
	local user = user_sessions[event.username];
	local marks = user and user.firewall_marks;
	if marks then
		marks[event.mark] = nil;
	end
	local ok, err = mark_map_storage:set(event.username, event.mark, nil);
	if not ok then
		module:log("error", "Failed to unmark user %q with %q: %s", event.username, event.mark, err);
	end
	return true;
end, -1);
