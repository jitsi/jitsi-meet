-- Token authentication
-- Copyright (C) 2015 Atlassian

local hashes = require "util.hashes";

local _M = {};

local function calc_hash(password, appId, appSecret)
	local hash, room, ts = string.match(password, "(%w+)_(%w+)_(%d+)");
	if hash ~= nil and room ~= nil and ts ~= nil then
		log("debug", "Hash: '%s' room: '%s', ts: '%s'", hash, room, ts);
                local toHash = room .. ts .. appId .. appSecret;
		log("debug", "to be hashed: '%s'", toHash);
		local hash = hashes.sha256(toHash, true);
		log("debug", "hash: '%s'", hash);
		return hash;
	else
		log("error", "Invalid password format: '%s'", password);
		return nil;
	end
end

local function extract_hash(password)
	local hash, room, ts = string.match(password, "(%w+)_(%w+)_(%d+)");
	return hash;
end

local function extract_ts(password)
	local hash, room, ts = string.match(password, "(%w+)_(%w+)_(%d+)");
	return ts;
end

local function get_utc_timestamp()
        return os.time(os.date("!*t")) * 1000;
end

local function verify_timestamp(ts, tokenLifetime)
	return get_utc_timestamp() - ts <= tokenLifetime;
end

local function verify_password_impl(password, appId, appSecret, tokenLifetime)

	if password == nil then
   		return nil, "password is missing";
        end

	if tokenLifetime == nil then
		tokenLifetime = 24 * 60 * 60 * 1000;
	end

	local ts = extract_ts(password);	
	if ts == nil then
		return nil, "timestamp not found in the password";
	end
       	local os_ts = get_utc_timestamp();
	log("debug", "System TS: '%s' user TS: %s", tostring(os_ts), tostring(ts));
	local isValid = verify_timestamp(ts, tokenLifetime);
	if not isValid then
		return nil, "token expired";
	end

	local realHash = calc_hash(password, appId, appSecret);
	local givenhash = extract_hash(password);
        log("debug", "Compare '%s' to '%s'", tostring(realHash), tostring(givenhash));
	if realHash == givenhash then
		return true;
	else
		return nil, "invalid hash";
	end
end

function _M.verify_password(password, appId, appSecret, tokenLifetime)
	return verify_password_impl(password, appId, appSecret, tokenLifetime);
end

return _M;
