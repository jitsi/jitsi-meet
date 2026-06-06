-- luacheck: globals load_unload_scripts
local set = require "util.set";
local ltn12 = require "ltn12";

local xmppstream = require "util.xmppstream";

local function stderr(...)
	io.stderr:write("** ", table.concat({...}, "\t", 1, select("#", ...)), "\n");
end

return function (arg)
	require "net.http".request = function (url, ex, cb)
		stderr("Making HTTP request to "..url);
		local body_table = {};
		local ok, response_status, response_headers = require "ssl.https".request({
			url = url;
			headers = ex.headers;
			method = ex.body and "POST" or "GET";
			sink = ltn12.sink.table(body_table);
			source = ex.body and ltn12.source.string(ex.body) or nil;
		});
		stderr("HTTP response "..response_status);
		cb(table.concat(body_table), response_status, { headers = response_headers });
		return true;
	end;

	local stats_dropped, stats_passed = 0, 0;

	load_unload_scripts(set.new(arg));
	local stream_callbacks = { default_ns = "jabber:client" };

	function stream_callbacks.streamopened(session)
		session.notopen = nil;
	end
	function stream_callbacks.streamclosed()
	end
	function stream_callbacks.error(session, error_name, error_message) -- luacheck: ignore 212/session
		stderr("Fatal error parsing XML stream: "..error_name..": "..tostring(error_message))
		assert(false);
	end
	function stream_callbacks.handlestanza(session, stanza)
		if not module:fire_event("firewall/chains/deliver", { origin = session, stanza = stanza }) then
			stats_passed = stats_passed + 1;
			print(stanza);
			print("");
		else
			stats_dropped = stats_dropped + 1;
		end
	end

	local session = { notopen = true };
	function session.send(stanza)
		stderr("Reply:", "\n"..tostring(stanza).."\n");
	end
	local stream = xmppstream.new(session, stream_callbacks);
	stream:feed("<stream:stream xmlns:stream='http://etherx.jabber.org/streams' xmlns='jabber:client'>");
	local line_count = 0;
	for line in io.lines() do
		line_count = line_count + 1;
		local ok, err = stream:feed(line.."\n");
		if not ok then
			stderr("Fatal XML parse error on line "..line_count..": "..err);
			return 1;
		end
	end

	stderr("Summary");
	stderr("-------");
	stderr("");
	stderr(stats_dropped + stats_passed, "processed");
	stderr(stats_passed, "passed");
	stderr(stats_dropped, "dropped");
	stderr(line_count, "input lines");
	stderr("");
end
