-- Token authentication
-- Copyright (C) 2015 Atlassian

local basexx = require "basexx";
local have_async, async = pcall(require, "util.async");
local hex = require "util.hex";
local http = require "net.http";
local json = require "cjson";
local path = require "util.paths";
local sha256 = require "util.hashes".sha256;
local timer = require "util.timer";

local jwt = require "luajwtjitsi";

local _M = {};

local appId = module:get_option_string("app_id");
local appSecret = module:get_option_string("app_secret");
local asapKeyServer = module:get_option_string("asap_key_server");
local allowEmptyToken = module:get_option_boolean("allow_empty_token");
local disableRoomNameConstraints = module:get_option_boolean("disable_room_name_constraints");

-- TODO: Figure out a less arbitrary default cache size.
local cacheSize = module:get_option_number("jwt_pubkey_cache_size", 128);
local cache = require"util.cache".new(cacheSize);

local function _check_config()
    if allowEmptyToken == true then
        module:log("warn", "WARNING - empty tokens allowed");
    end

    if appId == nil then
        module:log("error", "'app_id' must not be empty");
        return true;
    end

    if appSecret == nil and asapKeyServer == nil then
        module:log("error", "'app_secret' or 'asap_key_server' must be specified");
        return true;
    end

    if asapKeyServer and not have_async then
        module:log("error", "requires a version of Prosody with util.async");
        return true;
    end

    return false;
end

local http_timeout = 30;
local http_headers = {
    ["User-Agent"] = "Prosody ("..prosody.version.."; "..prosody.platform..")"
};

function get_public_key(keyId)
    local content = cache:get(keyId);
    if content == nil then
        -- If the key is not found in the cache.
        module:log("debug", "Cache miss for key: "..keyId);
        local code;
        local wait, done = async.waiter();
        local function cb(content_, code_, response_, request_)
            content, code = content_, code_;
            if code == 200 or code == 204 then
                cache:set(keyId, content);
            end
            done();
        end
        local keyurl = path.join(asapKeyServer, hex.to(sha256(keyId))..'.pem');
        module:log("debug", "Fetching public key from: "..keyurl);

        -- We hash the key ID to work around some legacy behavior and make
        -- deployment easier. It also helps prevent directory
        -- traversal attacks (although path cleaning could have done this too).
        local request = http.request(keyurl, {
            headers = http_headers or {},
            method = "GET"
        }, cb);

        -- TODO: Is the done() call racey? Can we cancel this if the request
        --       succeedes?
        local function cancel()
            -- TODO: This check is racey. Not likely to be a problem, but we should
            --       still stick a mutex on content / code at some point.
            if code == nil then
                http.destroy_request(request);
                done();
            end
        end
        timer.add_task(http_timeout, cancel);
        wait();

        if code == 200 or code == 204 then
            return content;
        end
    else
        -- If the key is in the cache, use it.
        module:log("debug", "Cache hit for key: "..keyId);
        return content;
    end

    return nil;
end

local function _verify_jwt_token(token, appId, appSecret, disableRoomNameConstraints)

	local claims, err = jwt.decode(token, appSecret, true);
	if claims == nil then
		return nil, err;
	end

	local alg = claims["alg"];
	if alg ~= nil and (alg == "none" or alg == "") then
		return nil, "'alg' claim must not be empty";
	end

	local issClaim = claims["iss"];
	if issClaim == nil then
		return nil, "'iss' claim is missing";
	end
	if issClaim ~= appId then
		return nil, "Invalid application ID('iss' claim)";
	end

	local roomClaim = claims["room"];
	if roomClaim == nil and disableRoomNameConstraints ~= true then
		return nil, "'room' claim is missing";
	end

    local audClaim = claims["aud"];
    if audClaim == nil then
        return nil, "'aud' claim is missing";
    end

	return claims;
end

local function _verify_token(session, token)

    if token == nil then
        if allowEmptyToken then
            return true;
        else
            return false, "not-allowed", "token required";
        end
    end

    local pubKey;
    if asapKeyServer and session.auth_token ~= nil then
        local dotFirst = session.auth_token:find("%.");
        if not dotFirst then return nil, "Invalid token" end
        local header = json.decode(basexx.from_url64(session.auth_token:sub(1,dotFirst-1)));
        local kid = header["kid"];
        if kid == nil then
            return false, "not-allowed", "'kid' claim is missing";
        end
        pubKey = get_public_key(kid);
        if pubKey == nil then
            return false, "not-allowed", "could not obtain public key";
        end
    end

    -- now verify the whole token
    local claims, msg;
    if asapKeyServer then
        claims, msg = _verify_jwt_token(token, appId, pubKey, disableRoomNameConstraints);
    else
        claims, msg = _verify_jwt_token(token, appId, appSecret, disableRoomNameConstraints);
    end
    if claims ~= nil then
        -- Binds room name to the session which is later checked on MUC join
        session.jitsi_meet_room = claims["room"];
        session.jitsi_meet_domain = claims["aud"];
        return true;
    else
        return false, "not-allowed", msg;
    end
end

function _M.verify_token(session, token)
    return _verify_token(session, token);
end

function _M.check_config()
    return _check_config();
end

return _M;
