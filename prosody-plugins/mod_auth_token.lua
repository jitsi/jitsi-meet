-- Token authentication
-- Copyright (C) 2015 Atlassian

local usermanager = require "core.usermanager";
local new_sasl = require "util.sasl".new;

local log = module._log;
local host = module.host;

local token_util = module:require "token/util";

-- define auth provider
local provider = {};

--do
--	local list;
--	for mechanism in pairs(new_sasl(module.host):mechanisms()) do
--		list = (not(list) and mechanism) or (list..", "..mechanism);
--	end
--	if not list then
--		module:log("error", "No mechanisms");
--	else
--		module:log("error", "Mechanisms: %s", list);
--	end
--end


local appId = module:get_option_string("app_id");
local appSecret = module:get_option_string("app_secret");

function provider.test_password(username, password)
	local result, msg = token_util.verify_password(password, appId, appSecret, nil);
	if result == true then
		return true;
	else
		log("error", "Token auth failed for user %s, reason: %s",username, msg);
		return nil, msg;
	end
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

function provider.users()
	return next, hosts[module.host].sessions, nil;
end

function provider.create_user(username, password)
	return nil;
end

function provider.delete_user(username)
	return nil;
end

function provider.get_sasl_handler()
	local testpass_authentication_profile = {
		plain_test = function(sasl, username, password, realm)
			return usermanager.test_password(username, realm, password), true;
		end
	};
	return new_sasl(host, testpass_authentication_profile);
end

module:provides("auth", provider);
