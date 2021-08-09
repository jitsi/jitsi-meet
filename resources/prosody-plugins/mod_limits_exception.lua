-- we use async to detect Prosody 0.10 and earlier
local have_async = pcall(require, 'util.async');

if not have_async then
	return;
end

local unlimited_jids = module:get_option_inherited_set("unlimited_jids", {});

-- rises the limit of the stanza size for the unlimited jids, default is 10MB
local unlimited_stanza_size_limit = module:get_option_number("unlimited_size", 10*1024*1024);

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

		if unlimited_stanza_size_limit then
			module:log('info', 'Setting stanza size limits for %s to %s', jid, unlimited_stanza_size_limit)
			session.stream:set_stanza_size_limit(unlimited_stanza_size_limit);
		end
	end
end);
