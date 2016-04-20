-- Token authentication
-- Copyright (C) 2015 Atlassian

local generate_uuid = require "util.uuid".generate;
local new_sasl = require "util.sasl".new;
local sasl = require "util.sasl";
local formdecode = require "util.http".formdecode;
local token_util = module:require "token/util";

-- define auth provider
local provider = {};

local host = module.host;

local appId = module:get_option_string("app_id");
local appSecret = module:get_option_string("app_secret");
local allowEmptyToken = module:get_option_boolean("allow_empty_token");

if allowEmptyToken == true then
	module:log("warn", "WARNING - empty tokens allowed");
end

if appId == nil then
	module:log("error", "'app_id' must not be empty");
	return;
end

if appSecret == nil then
	module:log("error", "'app_secret' must not be empty");
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

function provider.get_sasl_handler(session)
	-- JWT token extracted from BOSH URL
	local token = session.auth_token;

	local function get_username_from_token(self, message)

		if token == nil then
			if allowEmptyToken == true then
				return true;
			else
				return false, "not-allowed", "token required";
			end
		end

		-- here we check if 'room' claim exists
		local room, roomErr = token_util.get_room_name(token, appSecret);
		if room == nil then
            if roomErr == nil then
                roomErr = "'room' claim is missing";
            end
			return false, "not-allowed", roomErr;
		end

		-- now verify the whole token
		local result, msg
		= token_util.verify_token(token, appId, appSecret, room);
		if result == true then
			-- Binds room name to the session which is later checked on MUC join
			session.jitsi_meet_room = room;
			return true
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

