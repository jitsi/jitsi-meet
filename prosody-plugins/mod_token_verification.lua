-- Token authentication
-- Copyright (C) 2015 Atlassian

local log = module._log;
local host = module.host;
local st = require "util.stanza";
local token_util = module:require("token/util");
local is_admin = require "core.usermanager".is_admin;


local parentHostName = string.gmatch(tostring(host), "%w+.(%w.+)")();
if parentHostName == nil then
	log("error", "Failed to start - unable to get parent hostname");
	return;
end

local parentCtx = module:context(parentHostName);
if parentCtx == nil then
	log("error", "Failed to start - unable to get parent context for host: %s", tostring(parentHostName));
	return;
end

local appId = parentCtx:get_option_string("app_id");
local appSecret = parentCtx:get_option_string("app_secret");
local tokenLifetime = parentCtx:get_option_string("token_lifetime");

log("debug", "%s - starting MUC token verifier app_id: %s app_secret: %s token-lifetime: %s",
	tostring(host), tostring(appId), tostring(appSecret), tostring(tokenLifetime));

local function handle_pre_create(event)
	local origin, stanza = event.origin, event.stanza;	
	local token = stanza:get_child("token", "http://jitsi.org/jitmeet/auth-token");
	-- token not required for admin users
	local user_jid = stanza.attr.from;	
	if is_admin(user_jid) then
		log("debug", "Token not required from admin user: %s", user_jid);
		return nil;
	end
	log("debug", "Will verify token for user: %s ", user_jid);
	if token ~= nil then
		token = token[1];
	end
	local result, msg = token_util.verify_password(token, appId, appSecret, tokenLifetime);
	if result ~= true then
		log("debug", "Token verification failed: %s", msg);
		origin.send(st.error_reply(stanza, "cancel", "not-allowed", msg));
		return true;
	end
end

module:hook("muc-room-pre-create", handle_pre_create);

