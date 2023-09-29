-- Using version https://hg.prosody.im/prosody-modules/file/4fb922aa0ace/mod_s2soutinjection/mod_s2soutinjection.lua
local st = require"util.stanza";
local new_outgoing = require"core.s2smanager".new_outgoing;
local bounce_sendq = module:depends"s2s".route_to_new_session.bounce_sendq;
local initialize_filters = require "util.filters".initialize;

local portmanager = require "core.portmanager";

local addclient = require "net.server".addclient;

module:depends("s2s");

local sessions = module:shared("sessions");

local injected = module:get_option("s2s_connect_overrides");

-- The proxy_listener handles connection while still connecting to the proxy,
-- then it hands them over to the normal listener (in mod_s2s)
local proxy_listener = { default_port = nil, default_mode = "*a", default_interface = "*" };

function proxy_listener.onconnect(conn)
	local session = sessions[conn];

	-- needed in mod_rate_limit
	session.ip = conn:ip();

	-- Now the real s2s listener can take over the connection.
	local listener = portmanager.get_service("s2s").listener;

	local log = session.log;

	local filter = initialize_filters(session);

	session.version = 1;

	session.sends2s = function (t)
		log("debug", "sending (s2s over proxy): %s", (t.top_tag and t:top_tag()) or t:match("^[^>]*>?"));
		if t.name then
			t = filter("stanzas/out", t);
		end
		if t then
			t = filter("bytes/out", tostring(t));
			if t then
				return conn:write(tostring(t));
			end
		end
	end

	session.open_stream = function ()
		session.sends2s(st.stanza("stream:stream", {
			xmlns='jabber:server', ["xmlns:db"]='jabber:server:dialback',
			["xmlns:stream"]='http://etherx.jabber.org/streams',
			from=session.from_host, to=session.to_host, version='1.0', ["xml:lang"]='en'}):top_tag());
	end

	conn.setlistener(conn, listener);

	listener.register_outgoing(conn, session);

	listener.onconnect(conn);
end

function proxy_listener.register_outgoing(conn, session)
	session.direction = "outgoing";
	sessions[conn] = session;
end

function proxy_listener.ondisconnect(conn, err)
	sessions[conn]  = nil;
end

module:hook("route/remote", function(event)
	local from_host, to_host, stanza = event.from_host, event.to_host, event.stanza;
	local inject = injected and injected[to_host];
	if not inject then return end
	module:log("debug", "opening a new outgoing connection for this stanza");
	local host_session = new_outgoing(from_host, to_host);

	-- Store in buffer
	host_session.bounce_sendq = bounce_sendq;
	host_session.sendq = { {tostring(stanza), stanza.attr.type ~= "error" and stanza.attr.type ~= "result" and st.reply(stanza)} };
	host_session.log("debug", "stanza [%s] queued until connection complete", tostring(stanza.name));

	local host, port = inject[1] or inject, tonumber(inject[2]) or 5269;

	local conn = addclient(host, port, proxy_listener, "*a");

	proxy_listener.register_outgoing(conn, host_session);

	host_session.conn = conn;
	return true;
end, -2);

