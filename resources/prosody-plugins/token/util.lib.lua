-- Token authentication
-- Copyright (C) 2015 Atlassian

local basexx = require "basexx";
local have_async, async = pcall(require, "util.async");
local hex = require "util.hex";
local jwt = require "luajwtjitsi";
local http = require "net.http";
local json = require "cjson";
local path = require "util.paths";
local sha256 = require "util.hashes".sha256;
local timer = require "util.timer";

local http_timeout = 30;
local http_headers = {
    ["User-Agent"] = "Prosody ("..prosody.version.."; "..prosody.platform..")"
};

-- TODO: Figure out a less arbitrary default cache size.
local cacheSize = module:get_option_number("jwt_pubkey_cache_size", 128);
local cache = require"util.cache".new(cacheSize);

local Util = {}
Util.__index = Util

--- Constructs util class for token verifications.
-- Constructor that uses the passed module to extract all the
-- needed configurations.
-- If confuguration is missing returns nil
-- @param module the module in which options to check for configs.
-- @return the new instance or nil
function Util.new(module)
    local self = setmetatable({}, Util)

    self.appId = module:get_option_string("app_id");
    self.appSecret = module:get_option_string("app_secret");
    self.asapKeyServer = module:get_option_string("asap_key_server");
    self.allowEmptyToken = module:get_option_boolean("allow_empty_token");

    if self.allowEmptyToken == true then
        module:log("warn", "WARNING - empty tokens allowed");
    end

    if self.appId == nil then
        module:log("error", "'app_id' must not be empty");
        return nil;
    end

    if self.appSecret == nil and self.asapKeyServer == nil then
        module:log("error", "'app_secret' or 'asap_key_server' must be specified");
        return nil;
    end

    if self.asapKeyServer and not have_async then
        module:log("error", "requires a version of Prosody with util.async");
        return nil;
    end

    return self
end

--- Returns the public key by keyID
-- @param keyId the key ID to request
-- @return the public key (the content of requested resource) or nil
function Util:get_public_key(keyId)
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
        local keyurl = path.join(self.asapKeyServer, hex.to(sha256(keyId))..'.pem');
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

--- Verifies token
-- @param token the token to verify
-- @return nil and error or the extracted claims from the token
function Util:verify_token(token)
    local claims, err = jwt.decode(token, self.appSecret, true);
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
    if issClaim ~= self.appId then
        return nil, "Invalid application ID('iss' claim)";
    end

    local roomClaim = claims["room"];
    if roomClaim == nil then
        return nil, "'room' claim is missing";
    end

    return claims;
end

--- Verifies token and process needed values to be stored in the session.
-- Stores in session the following values:
-- session.jitsi_meet_room - the room name value from the token
-- @param session the current session
-- @param token the token to verify
-- @return false and error
function Util:process_and_verify_token(session, token)

    if token == nil then
        if self.allowEmptyToken then
            return true;
        else
            return false, "not-allowed", "token required";
        end
    end

    local pubKey;
    if self.asapKeyServer and session.auth_token ~= nil then
        local dotFirst = session.auth_token:find("%.");
        if not dotFirst then return nil, "Invalid token" end
        local header = json.decode(basexx.from_url64(session.auth_token:sub(1,dotFirst-1)));
        local kid = header["kid"];
        if kid == nil then
            return false, "not-allowed", "'kid' claim is missing";
        end
        pubKey = self:get_public_key(kid);
        if pubKey == nil then
            return false, "not-allowed", "could not obtain public key";
        end
    end

    -- now verify the whole token
    local claims, msg;
    if self.asapKeyServer then
        claims, msg = self:verify_token(token);
    else
        claims, msg = self:verify_token(token);
    end
    if claims ~= nil then
        -- Binds room name to the session which is later checked on MUC join
        session.jitsi_meet_room = claims["room"];
        return true;
    else
        return false, "not-allowed", msg;
    end
end

--- Verifies room name if necesarry.
-- Checks configs and if necessary checks the room name extracted from
-- room_address against the one saved in the session when token was verified
-- @param session the current session
-- @param room_address the whole room address as received
-- @return returns true in case room was verified or there is no need to verify
--         it and returns false in case verification was processed
--         and was not successful
function Util:verify_room(session, room_address)
    if self.allowEmptyToken and session.auth_token == nil then
        module:log(
            "debug",
            "Skipped room token verification - empty tokens are allowed");
        return true;
    end

    local room = string.match(room_address, "^(%w+)@");
    if room == nil then
        log("error",
            "Unable to get name of the MUC room ? to: %s", room_address);
        return true;
    end

    local auth_room = session.jitsi_meet_room;
    if room ~= string.lower(auth_room) then
        return false;
    end

    return true;
end

return Util;
