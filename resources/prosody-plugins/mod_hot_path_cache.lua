-- Caches the results of two functions of prosody's core libraries that run for every stanza and recipient:
-- util.stanza's xml_escape, used when a stanza is serialised, and util.jid's split, used when a stanza is
-- routed. A large room sends the same presence to every occupant, so the same few thousand strings are escaped
-- and split again and again. In a stage load test of a 400 student class this saved 5-10% of prosody's CPU
-- per joined session.
--
-- Both libraries call these functions through local variables, so the module replaces the values of those
-- locals (debug.setupvalue) as well as the exported fields. Code that kept its own reference to the original
-- function when it was loaded keeps calling the original. If a local is not found, for example after a prosody
-- upgrade, that function is left alone and a warning is logged. Unloading the module restores the originals, but
-- modules loaded while it was active keep the cached split they took a reference to (its results are the same), so
-- restart prosody to drop the cache completely.
--
-- It is off by default. Load it as a global module and enable it:
--   modules_enabled = { ...; "hot_path_cache"; }
--   hot_path_cache_enabled = true
module:set_global();

if not module:get_option_boolean("hot_path_cache_enabled", false) then
	module:log("info", "Not caching, hot_path_cache_enabled is not set");
	return;
end

local st = require "util.stanza";
local jid = require "util.jid";

-- get_option_number returns nil for a value that is not a number
local cache_size = module:get_option_number("hot_path_cache_size", 10000) or 10000;

-- Longer strings, e.g. message bodies, are rarely escaped twice.
local ESCAPE_MAX_LENGTH = 256;

local restorers = {};

local function find_upvalue(f, name)
	for i = 1, 255 do
		local upvalue_name, value = debug.getupvalue(f, i);
		if upvalue_name == nil then
			return nil;
		end
		if upvalue_name == name then
			return i, value;
		end
	end
end

-- Sets the local that f sees under name. Every function of the library that uses that local sees the new value.
local function replace_upvalue(f, name, value)
	local index, original = find_upvalue(f, name);
	if not index then
		return nil;
	end
	debug.setupvalue(f, index, value);
	table.insert(restorers, function () debug.setupvalue(f, index, original); end);
	return original;
end

local function replace_field(t, key, value)
	local original = t[key];
	t[key] = value;
	table.insert(restorers, function () t[key] = original; end);
end

local function cached_escape(escape)
	local results, count = {}, 0;
	return function (str)
		if type(str) ~= "string" then
			return escape(str);
		end
		local escaped = results[str];
		if escaped == nil then
			escaped = escape(str);
			if #str <= ESCAPE_MAX_LENGTH then
				if count >= cache_size then
					results, count = {}, 0;
				end
				results[str] = escaped;
				count = count + 1;
			end
		end
		return escaped;
	end
end

local INVALID = {};

-- The longest valid JID (RFC 7622: each of the three parts is at most 1023 bytes). Longer strings, which a client
-- can send in 'to', are split without being kept, so they can not fill the cache.
local JID_MAX_LENGTH = 3071;

local function cached_split(split)
	local results, count = {}, 0;
	return function (s)
		if type(s) ~= "string" or #s > JID_MAX_LENGTH then
			return split(s);
		end
		local parts = results[s];
		if parts == nil then
			local node, host, resource = split(s);
			parts = host == nil and INVALID or { node, host, resource };
			if count >= cache_size then
				results, count = {}, 0;
			end
			results[s] = parts;
			count = count + 1;
		end
		if parts == INVALID then
			return nil, nil, nil;
		end
		return parts[1], parts[2], parts[3];
	end
end

local stanza_mt = getmetatable(st.stanza("x"));
local _, xml_escape = find_upvalue(stanza_mt.__tostring, "xml_escape");
if xml_escape then
	local escape = cached_escape(xml_escape);
	replace_upvalue(stanza_mt.__tostring, "xml_escape", escape);
	replace_field(st, "xml_escape", escape);
	module:log("info", "Caching util.stanza xml_escape results (up to %d)", cache_size);
else
	module:log("warn", "util.stanza has no xml_escape local, not caching it");
end

local _, split = find_upvalue(jid.bare, "split");
if split then
	local cached = cached_split(split);
	replace_upvalue(jid.bare, "split", cached);
	replace_field(jid, "split", cached);
	module:log("info", "Caching util.jid split results (up to %d)", cache_size);
else
	module:log("warn", "util.jid has no split local, not caching it");
end

function module.unload()
	for i = #restorers, 1, -1 do
		restorers[i]();
	end
	restorers = {};
end
