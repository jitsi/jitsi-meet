-- Token authentication
-- Copyright (C) 2015 Atlassian

local log = module._log;
local host = module.host;
local st = require "util.stanza";
local is_admin = require "core.usermanager".is_admin;


local parentHostName = string.gmatch(tostring(host), "%w+.(%w.+)")();
if parentHostName == nil then
	log("error", "Failed to start - unable to get parent hostname");
	return;
end

local parentCtx = module:context(parentHostName);
if parentCtx == nil then
	log("error",
		"Failed to start - unable to get parent context for host: %s",
		tostring(parentHostName));
	return;
end

local appId = parentCtx:get_option_string("app_id");
local appSecret = parentCtx:get_option_string("app_secret");
local allowEmptyToken = parentCtx:get_option_boolean("allow_empty_token");
local disableRoomNameConstraints = parentCtx:get_option_boolean("disable_room_name_constraints")

log("debug",
	"%s - starting MUC token verifier app_id: %s app_secret: %s allow empty: %s",
	tostring(host), tostring(appId), tostring(appSecret),
	tostring(allowEmptyToken));

local function verify_user(session, stanza)
	log("debug", "Session token: %s, session room: %s",
		tostring(session.auth_token),
		tostring(session.jitsi_meet_room));

	-- token not required for admin users
	local user_jid = stanza.attr.from;
	if is_admin(user_jid) then
		log("debug", "Token not required from admin user: %s", user_jid);
		return nil;
	end

	if allowEmptyToken and session.auth_token == nil then
		module:log(
			"debug",
			"Skipped room token verification - empty tokens are allowed");
		return nil;
	end

	local room = string.match(stanza.attr.to, "^(%w+)@");
	log("debug", "Will verify token for user: %s, room: %s ", user_jid, room);
	if room == nil then
		log("error",
			"Unable to get name of the MUC room ? to: %s", stanza.attr.to);
		return nil;
	end

	local token = session.auth_token;
	local auth_room = session.jitsi_meet_room;
	if disableRoomNameConstraints ~= true and room ~= string.lower(auth_room) then
		log("error", "Token %s not allowed to join: %s",
			tostring(token), tostring(auth_room));
		session.send(
			st.error_reply(
				stanza, "cancel", "not-allowed", "Room and token mismatched"));
		return true;
	end
	log("debug", "allowed: %s to enter/create room: %s", user_jid, room);
end

module:hook("muc-room-pre-create", function(event)
	local origin, stanza = event.origin, event.stanza;
	log("debug", "pre create: %s %s", tostring(origin), tostring(stanza));
	return verify_user(origin, stanza);
end);

module:hook("muc-occupant-pre-join", function(event)
	local origin, room, stanza = event.origin, event.room, event.stanza;
	log("debug", "pre join: %s %s", tostring(room), tostring(stanza));
	return verify_user(origin, stanza);
end);
