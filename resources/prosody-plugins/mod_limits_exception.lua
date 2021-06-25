-- we use async to detect Prosody 0.10 and earlier
local have_async = pcall(require, 'util.async');

if not have_async then
	return;
end

local unlimited_jids = module:get_option_inherited_set("unlimited_jids", {});

if unlimited_jids:empty() then
	return;
end

module:hook("authentication-success", function (event)
	local session = event.session;
	local jid = session.username .. "@" .. session.host;
	if unlimited_jids:contains(jid) then
		if session.conn and session.conn.setlimit then
			session.conn:setlimit(0);
		elseif session.throttle then
			session.throttle = nil;
		end
	end
end);
