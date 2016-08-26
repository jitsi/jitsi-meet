-- Token authentication
-- Copyright (C) 2015 Atlassian

local basexx = require 'basexx';
local have_async, async = pcall(require, "util.async");
local formdecode = require "util.http".formdecode;
local generate_uuid = require "util.uuid".generate;
local http = require "net.http";
local json = require 'cjson'
json.encode_empty_table('array')
local new_sasl = require "util.sasl".new;
local sasl = require "util.sasl";
local timer = require "util.timer";
local token_util = module:require "token/util";

-- define auth provider
local provider = {};

local host = module.host;

local appId = module:get_option_string("app_id");
local appSecret = module:get_option_string("app_secret");
local asapKeyServer = module:get_option_string("asap_key_server");
local allowEmptyToken = module:get_option_boolean("allow_empty_token");
local disableRoomNameConstraints = module:get_option_boolean("disable_room_name_constraints");

-- TODO: Figure out a less arbitrary default cache size.
local cacheSize = module:get_option_number("jwt_pubkey_cache_size", 128);
local cache = require"util.cache".new(cacheSize);

if allowEmptyToken == true then
	module:log("warn", "WARNING - empty tokens allowed");
end

if appId == nil then
	module:log("error", "'app_id' must not be empty");
	return;
end

if appSecret == nil and asapKeyServer == nil then
	module:log("error", "'app_secret' or 'asap_key_server' must be specified");
	return;
end

if asapKeyServer and not have_async then
	module:log("error", "requires a version of Prosody with util.async");
	return;
end

-- Extract 'token' param from BOSH URL when session is created
module:hook("bosh-session", function(event)
	local session, request = event.session, event.request;
	local query = request.url.query;
	if query ~= nil then
		session.auth_token = query and formdecode(query).token or nil;
	end
end)

function provider.test_password(username, password)
	return nil, "Password based auth not supported";
end

function provider.get_password(username)
	return nil;
end

function provider.set_password(username, password)
	return nil, "Set password not supported";
end

function provider.user_exists(username)
	return nil;
end

function provider.create_user(username, password)
	return nil;
end

function provider.delete_user(username)
	return nil;
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
			done();
		end
		module:log("debug", "Fetching public key from: "..asapKeyServer..keyId);
		local request = http.request(asapKeyServer..keyId, {
			headers = http_headers or {},
			method = "GET"
		}, cb);
		-- TODO: Is the done() call racey? Can we cancel this if the request
		--       succeedes?
		timer.add_task(http_timeout, function() http.destroy_request(request); done(); end);
		wait();

		if code == 200 or code == 204 then
			module:log("debug", "Cache hit for key: "..keyId);
			return content;
		end
	else
		-- If the key is in the cache, use it.
		return content;
	end

	return nil;
end

function provider.get_sasl_handler(session)
	-- JWT token extracted from BOSH URL
	local token = session.auth_token;

	local function get_username_from_token(self, message)

		if token == nil then
			if allowEmptyToken then
				return true;
			else
				return false, "not-allowed", "token required";
			end
		end

		local pubKey;
		if asapKeyServer and session.auth_token ~= nil then
			local dotFirst = session.auth_token:find("%.")
			if not dotFirst then return nil, "Invalid token" end
			local header = json.decode(basexx.from_url64(session.auth_token:sub(1,dotFirst-1)))
			local kid = header["kid"]
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
			claims, msg = token_util.verify_token(token, appId, pubKey, disableRoomNameConstraints);
		else
			claims, msg = token_util.verify_token(token, appId, appSecret, disableRoomNameConstraints);
		end
		if claims ~= true then
			-- Binds room name to the session which is later checked on MUC join
			session.jitsi_meet_room = claims["room"];
			return true;
		else
			return false, "not-allowed", msg
		end
	end

	return new_sasl(host, { anonymous = get_username_from_token });
end

module:provides("auth", provider);

local function anonymous(self, message)

	local username = generate_uuid();

	-- This calls the handler created in 'provider.get_sasl_handler(session)'
	local result, err, msg = self.profile.anonymous(self, username, self.realm);

	self.username = username;

	if result == true then
		return "success"
	else

		return "failure", err, msg
	end
end

sasl.registerMechanism("ANONYMOUS", {"anonymous"}, anonymous);
