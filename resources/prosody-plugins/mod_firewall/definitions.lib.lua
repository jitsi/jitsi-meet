
-- Name arguments are unused here
-- luacheck: ignore 212

local definition_handlers = {};

local http = require "net.http";
local timer = require "util.timer";
local set = require"util.set";
local new_throttle = require "util.throttle".create;
local hashes = require "util.hashes";
local jid = require "util.jid";
local lfs = require "lfs";

local multirate_cache_size = module:get_option_number("firewall_multirate_cache_limit", 1000);

function definition_handlers.ZONE(zone_name, zone_members)
			local zone_member_list = {};
			for member in zone_members:gmatch("[^, ]+") do
				zone_member_list[#zone_member_list+1] = member;
			end
			return set.new(zone_member_list)._items;
end

-- Helper function used by RATE handler
local function evict_only_unthrottled(name, throttle)
	throttle:update();
	-- Check whether the throttle is at max balance (i.e. totally safe to forget about it)
	if throttle.balance < throttle.max then
		-- Not safe to forget
		return false;
	end
end

function definition_handlers.RATE(name, line)
			local rate = assert(tonumber(line:match("([%d.]+)")), "Unable to parse rate");
			local burst = tonumber(line:match("%(%s*burst%s+([%d.]+)%s*%)")) or 1;
			local max_throttles = tonumber(line:match("%(%s*entries%s+([%d]+)%s*%)")) or multirate_cache_size;
			local deny_when_full = not line:match("%(allow overflow%)");
			return {
				single = function ()
					return new_throttle(rate*burst, burst);
				end;

				multi = function ()
					local cache = require "util.cache".new(max_throttles, deny_when_full and evict_only_unthrottled or nil);
					return {
						poll_on = function (_, key, amount)
							assert(key, "no key");
							local throttle = cache:get(key);
							if not throttle then
								throttle = new_throttle(rate*burst, burst);
								if not cache:set(key, throttle) then
									module:log("warn", "Multirate '%s' has hit its maximum number of active throttles (%d), denying new events", name, max_throttles);
									return false;
								end
							end
							return throttle:poll(amount);
						end;
					}
				end;
			};
end

local list_backends = {
	-- %LIST name: memory (limit: number)
	memory = {
		init = function (self, type, opts)
			if opts.limit then
				local have_cache_lib, cache_lib = pcall(require, "util.cache");
				if not have_cache_lib then
					error("In-memory lists with a size limit require Prosody 0.10");
				end
				self.cache = cache_lib.new((assert(tonumber(opts.limit), "Invalid list limit")));
				if not self.cache.table then
					error("In-memory lists with a size limit require a newer version of Prosody 0.10");
				end
				self.items = self.cache:table();
			else
				self.items = {};
			end
		end;
		add = function (self, item)
			self.items[item] = true;
		end;
		remove = function (self, item)
			self.items[item] = nil;
		end;
		contains = function (self, item)
			return self.items[item] == true;
		end;
	};

	-- %LIST name: http://example.com/ (ttl: number, pattern: pat, hash: sha1)
	http = {
		init = function (self, url, opts)
			local poll_interval = assert(tonumber(opts.ttl or "3600"), "invalid ttl for <"..url.."> (expected number of seconds)");
			local pattern = opts.pattern or "([^\r\n]+)\r?\n";
			assert(pcall(string.match, "", pattern), "invalid pattern for <"..url..">");
			if opts.hash then
				assert(opts.hash:match("^%w+$") and type(hashes[opts.hash]) == "function", "invalid hash function: "..opts.hash);
				self.hash_function = hashes[opts.hash];
			end
			local etag;
			local failure_count = 0;
			local retry_intervals = { 60, 120, 300 };
			-- By default only check the certificate if net.http supports SNI
			local sni_supported = http.feature and http.features.sni;
			local insecure = false;
			if opts.checkcert == "never" then
				insecure = true;
			elseif (opts.checkcert == nil or opts.checkcert == "when-sni") and not sni_supported then
				insecure = false;
			end
			local function update_list()
				http.request(url, {
					insecure = insecure;
					headers = {
						["If-None-Match"] = etag;
					};
				}, function (body, code, response)
					local next_poll = poll_interval;
					if code == 200 and body then
						etag = response.headers.etag;
						local items = {};
						for entry in body:gmatch(pattern) do
							items[entry] = true;
						end
						self.items = items;
						module:log("debug", "Fetched updated list from <%s>", url);
					elseif code == 304 then
						module:log("debug", "List at <%s> is unchanged", url);
					elseif code == 0 or (code >= 400 and code <=599) then
						module:log("warn", "Failed to fetch list from <%s>: %d %s", url, code, tostring(body));
						failure_count = failure_count + 1;
						next_poll = retry_intervals[failure_count] or retry_intervals[#retry_intervals];
					end
					if next_poll > 0 then
						timer.add_task(next_poll+math.random(0, 60), update_list);
					end
				end);
			end
			update_list();
		end;
		add = function ()
		end;
		remove = function ()
		end;
		contains = function (self, item)
			if self.hash_function then
				item = self.hash_function(item);
			end
			return self.items and self.items[item] == true;
		end;
	};

	-- %LIST: file:/path/to/file
	file = {
		init = function (self, file_spec, opts)
			local n, items = 0, {};
			self.items = items;
			local filename = file_spec:gsub("^file:", "");
			if opts.missing == "ignore" and not lfs.attributes(filename, "mode") then
				module:log("debug", "Ignoring missing list file: %s", filename);
				return;
			end
			local file, err = io.open(filename);
			if not file then
				module:log("warn", "Failed to open list from %s: %s", filename, err);
				return;
			else
				for line in file:lines() do
					if not items[line] then
						n = n + 1;
						items[line] = true;
					end
				end
			end
			module:log("debug", "Loaded %d items from %s", n, filename);
		end;
		add = function (self, item)
			self.items[item] = true;
		end;
		remove = function (self, item)
			self.items[item] = nil;
		end;
		contains = function (self, item)
			return self.items and self.items[item] == true;
		end;
	};

	-- %LIST: pubsub:pubsub.example.com/node
	-- TODO or the actual URI scheme? Bit overkill maybe?
	-- TODO Publish items back to the service?
	-- Step 1: Receiving pubsub events and storing them in the list
	-- We'll start by using only the item id.
	-- TODO Invent some custom schema for this? Needed for just a set of strings?
	pubsubitemid = {
		init = function(self, pubsub_spec, opts)
			local service_addr, node = pubsub_spec:match("^pubsubitemid:([^/]*)/(.*)");
			if not service_addr then
				module:log("warn", "Invalid list specification (expected 'pubsubitemid:<service>/<node>', got: '%s')", pubsub_spec);
				return;
			end
			module:depends("pubsub_subscription");
			module:add_item("pubsub-subscription", {
					service = service_addr;
					node = node;
					on_subscribed = function ()
						self.items = {};
					end;
					on_item = function (event)
						self:add(event.item.attr.id);
					end;
					on_retract = function (event)
						self:remove(event.item.attr.id);
					end;
					on_purge = function ()
						self.items = {};
					end;
					on_unsubscribed = function ()
						self.items = nil;
					end;
					on_delete= function ()
						self.items = nil;
					end;
				});
			-- TODO Initial fetch? Or should mod_pubsub_subscription do this?
		end;
		add = function (self, item)
			if self.items then
				self.items[item] = true;
			end
		end;
		remove = function (self, item)
			if self.items then
				self.items[item] = nil;
			end
		end;
		contains = function (self, item)
			return self.items and self.items[item] == true;
		end;
	};
};
list_backends.https = list_backends.http;

local normalize_functions = {
	upper = string.upper, lower = string.lower;
	md5 = hashes.md5, sha1 = hashes.sha1, sha256 = hashes.sha256;
	prep = jid.prep, bare = jid.bare;
};

local function wrap_list_method(list_method, filter)
	return function (self, item)
		return list_method(self, filter(item));
	end
end

local function create_list(list_backend, list_def, opts)
	if not list_backends[list_backend] then
		error("Unknown list type '"..list_backend.."'", 0);
	end
	local list = setmetatable({}, { __index = list_backends[list_backend] });
	if list.init then
		list:init(list_def, opts);
	end
	if opts.filter then
		local filters = {};
		for func_name in opts.filter:gmatch("[%w_]+") do
			if func_name == "log" then
				table.insert(filters, function (s)
					--print("&&&&&", s);
					module:log("debug", "Checking list <%s> for: %s", list_def, s);
					return s;
				end);
			else
				assert(normalize_functions[func_name], "Unknown list filter: "..func_name);
				table.insert(filters, normalize_functions[func_name]);
			end
		end

		local filter;
		local n = #filters;
		if n == 1 then
			filter = filters[1];
		else
			function filter(s)
				for i = 1, n do
					s = filters[i](s or "");
				end
				return s;
			end
		end

		list.add = wrap_list_method(list.add, filter);
		list.remove = wrap_list_method(list.remove, filter);
		list.contains = wrap_list_method(list.contains, filter);
	end
	return list;
end

--[[
%LIST spammers: memory (source: /etc/spammers.txt)

%LIST spammers: memory (source: /etc/spammers.txt)


%LIST spammers: http://example.com/blacklist.txt
]]

function definition_handlers.LIST(list_name, list_definition)
	local list_backend = list_definition:match("^%w+");
	local opts = {};
	local opt_string = list_definition:match("^%S+%s+%((.+)%)");
	if opt_string then
		for opt_k, opt_v in opt_string:gmatch("(%w+): ?([^,]+)") do
			opts[opt_k] = opt_v;
		end
	end
	return create_list(list_backend, list_definition:match("^%S+"), opts);
end

function definition_handlers.PATTERN(name, pattern)
	local ok, err = pcall(string.match, "", pattern);
	if not ok then
		error("Invalid pattern '"..name.."': "..err);
	end
	return pattern;
end

function definition_handlers.SEARCH(name, pattern)
	return pattern;
end

return definition_handlers;
