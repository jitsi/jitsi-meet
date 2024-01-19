-- Rate limits connection based on their ip address.
-- Rate limits creating sessions (new connections),
-- rate limits sent stanzas from same ip address (presence, iq, messages)
-- Copyright (C) 2023-present 8x8, Inc.

local cache = require"util.cache";
local ceil = math.ceil;
local http_server = require "net.http.server";
local gettime = require "util.time".now
local filters = require "util.filters";
local new_throttle = require "util.throttle".create;
local timer = require "util.timer";
local ip_util = require "util.ip";
local new_ip = ip_util.new_ip;
local match_ip = ip_util.match;
local parse_cidr = ip_util.parse_cidr;

local config = {};
local limits_resolution = 1;

local function load_config()
	-- Max allowed login rate in events per second.
	config.login_rate = module:get_option_number("rate_limit_login_rate", 3);
	-- The rate to which sessions from IPs exceeding the join rate will be limited, in bytes per second.
	config.session_rate = module:get_option_number("rate_limit_session_rate", 2000);
	-- The time in seconds, after which the limit for an IP address is lifted.
	config.timeout = module:get_option_number("rate_limit_timeout", 60);
	-- List of regular expressions for IP addresses that are not limited by this module.
	config.whitelist = module:get_option_set("rate_limit_whitelist", { "127.0.0.1", "::1" })._items;
	-- The size of the cache that saves state for IP addresses
	config.cache_size = module:get_option_number("rate_limit_cache_size", 10000);

	-- Max allowed presence rate in events per second.
	config.presence_rate = module:get_option_number("rate_limit_presence_rate", 4);
	-- Max allowed iq rate in events per second.
	config.iq_rate = module:get_option_number("rate_limit_iq_rate", 10);
	-- Max allowed message rate in events per second.
	config.message_rate = module:get_option_number("rate_limit_message_rate", 3);

	-- A list of jids for which sessions we ignore rate limiting
	config.whitelist_jids = module:get_option_set("rate_limit_whitelist_jids", {});

	local wl = "";
	for ip in config.whitelist do wl = wl .. ip  .. "," end
	local wl_jids = "";
	for j in config.whitelist_jids do wl_jids = wl_jids .. j  .. "," end
	module:log("info", "Loaded configuration: ");
	module:log("info", "- session_rate=%s bytes/sec, timeout=%s sec, cache size=%s, whitelist=%s, whitelist_jids=%s",
			config.session_rate, config.timeout, config.cache_size, wl, wl_jids);
	module:log("info", "- login_rate=%s/sec, presence_rate=%s/sec, iq_rate=%s/sec, message_rate=%s/sec",
			config.login_rate, config.presence_rate, config.iq_rate, config.message_rate);
end
load_config();

-- Maps an IP address to a util.throttle which keeps the rate of login/join events from that IP.
local login_rates = cache.new(config.cache_size);

-- Keeps the IP addresses that have exceeded the allowed login/join rate (i.e. the IP addresses whose sessions need
-- to be limited). Mapped to the last instant at which the rate was exceeded.
local limited_ips = cache.new(config.cache_size);

local function is_whitelisted(ip)
	local parsed_ip = new_ip(ip)
	for entry in config.whitelist do
		if match_ip(parsed_ip, parse_cidr(entry)) then
		  return true;
		end
    end

	return false;
end

local function is_whitelisted_jid(jid)
	return config.whitelist_jids:contains(jid);
end

-- Discover real remote IP of a session
-- Note: http_server.get_request_from_conn() was added in Prosody 0.12.3,
-- this code provides backwards compatibility with older versions
local get_request_from_conn = http_server.get_request_from_conn or function (conn)
	local response = conn and conn._http_open_response;
	return response and response.request or nil;
end;

-- Add an IP to the set of limied IPs
local function limit_ip(ip)
	module:log("info", "Limiting %s due to login/join rate exceeded.", ip);
	limited_ips:set(ip, gettime());
end

-- Installable as a session filter to limit the reading rate for a session. Based on mod_limits.
local function limit_bytes_in(bytes, session)
	local sess_throttle = session.jitsi_throttle;
	if sess_throttle then
		-- if the limit timeout has elapsed let's stop the throttle
		if not sess_throttle.start or gettime() - sess_throttle.start > config.timeout then
			module:log("info", "Stop throttling session=%s, ip=%s.", session, session.ip);
			session.jitsi_throttle = nil;
			return bytes;
		end
		local ok, _, outstanding = sess_throttle:poll(#bytes, true);
		if not ok then
			session.log("debug",
					"Session over rate limit (%d) with %d (by %d), pausing", sess_throttle.max, #bytes, outstanding);
			outstanding = ceil(outstanding);
			session.conn:pause(); -- Read no more data from the connection until there is no outstanding data
			local outstanding_data = bytes:sub(-outstanding);
			bytes = bytes:sub(1, #bytes-outstanding);
			timer.add_task(limits_resolution, function ()
				if not session.conn then return; end
				if sess_throttle:peek(#outstanding_data) then
					session.log("debug", "Resuming paused session");
					session.conn:resume();
				end
				-- Handle what we can of the outstanding data
				session.data(outstanding_data);
			end);
		end
	end
	return bytes;
end

-- Throttles reading from the connection of a specific session.
local function throttle_session(session)
	if not session.jitsi_throttle then
        if (session.conn and session.conn.setlimit) then
            -- TODO: we don't have a mechanism to unthrottle a session in this case.
		    module:log("info", "Enabling throttle (%s bytes/s) via setlimit, session=%s, ip=%s.", config.session_rate, session, session.ip);
            session.conn:setlimit(config.session_rate);
        else
		    module:log("info", "Enabling throttle (%s bytes/s) via filter, session=%s, ip=%s.", config.session_rate, session, session.ip);
		    session.jitsi_throttle = new_throttle(config.session_rate, 2);
		    filters.add_filter(session, "bytes/in", limit_bytes_in, 1000);
		    -- throttle.start used for stop throttling after the timeout
		    session.jitsi_throttle.start = gettime();
        end
	else
		-- update the throttling start
		session.jitsi_throttle.start = gettime();
	end
end

-- checks different stanzas for rate limiting (per session)
function filter_stanza(stanza, session)
	local rate = session[stanza.name.."_rate"];
	if rate then
		local ok, _, _ = rate:poll(1, true);
		if not ok then
			module:log("info", "%s rate exceeded for %s, limiting.", stanza.name, session.full_jid);
			throttle_session(session);
		end
	end

	return stanza;
end

local function on_login(session, ip)
	local login_rate = login_rates:get(ip);
	if not login_rate then
		module:log("debug", "Create new join rate for %s", ip);
		login_rate = new_throttle(config.login_rate, 2);
		login_rates:set(ip, login_rate);
	end

	local ok, _, _ = login_rate:poll(1, true);
	if not ok then
		module:log("info", "Join rate exceeded for %s, limiting.", ip);
		limit_ip(ip);
		throttle_session(session);
	end
end

local function filter_hook(session)
    -- ignore outgoing sessions (s2s)
    if session.outgoing then
        return;
    end

	local request = get_request_from_conn(session.conn);
	local ip = request and request.ip or session.ip;
	module:log("debug", "New session from %s", ip);
    if is_whitelisted(ip) or (session.username and is_whitelisted_jid(session.username..'@'..session.host)) then
        return;
    end

	on_login(session, ip);

	-- creates the stanzas rates
	session.presence_rate = new_throttle(config.presence_rate, 2);
	session.iq_rate = new_throttle(config.iq_rate, 2);
	session.message_rate = new_throttle(config.message_rate, 2);
	filters.add_filter(session, "stanzas/in", filter_stanza);

	local oldt = limited_ips:get(ip);
	if oldt then
		local newt = gettime();
		local elapsed = newt - oldt;
		if elapsed < 5 then
			module:log("info", "IP address %s was limitted %s seconds ago, refreshing.", ip, elapsed);
			limited_ips:set(ip, newt);
			throttle_session(session);
		elseif elapsed < config.timeout then
			throttle_session(session);
        else
            module:log("info", "Removing the limit for %s", ip);
            limited_ips:set(ip, nil);
		end
	end
end

function module.load()
	filters.add_filter_hook(filter_hook);
end

function module.unload()
	filters.remove_filter_hook(filter_hook);
end

module:hook_global("config-reloaded", load_config);

-- we calculate the stats on the configured interval (60 seconds by default)
local measure_limited_ips = module:measure('limited-ips', 'amount'); -- we send stats for the total number limited ips
module:hook_global('stats-update', function ()
    measure_limited_ips(limited_ips:count());
end);
