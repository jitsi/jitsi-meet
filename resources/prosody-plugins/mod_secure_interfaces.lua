-- Using version https://hg.prosody.im/prosody-modules/file/6c806a99f802/mod_secure_interfaces/mod_secure_interfaces.lua
local secure_interfaces = module:get_option_set("secure_interfaces", { "127.0.0.1", "::1" });

module:hook("stream-features", function (event)
	local session = event.origin;
	if session.type ~= "c2s_unauthed" then return; end
	local socket = session.conn:socket();
	if not socket.getsockname then
		module:log("debug", "Unable to determine local address of incoming connection");
		return;
	end
	local localip = socket:getsockname();
	if secure_interfaces:contains(localip) then
		module:log("debug", "Marking session from %s to %s as secure", session.ip or "[?]", localip);
		session.secure = true;
		session.conn.starttls = false;
	else
		module:log("debug", "Not marking session from %s to %s as secure", session.ip or "[?]", localip);
	end
end, 2500);
