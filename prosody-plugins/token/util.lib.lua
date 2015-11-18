-- Token authentication
-- Copyright (C) 2015 Atlassian

local jwt = require "luajwt";

local _M = {};

local function verify_password_impl(password, appId, appSecret, roomName)

	local claims, err = jwt.decode(password, appSecret, true);
	if claims == nil then
		return nil, err;
	end

	local issClaim = claims["iss"];
	if issClaim == nil then
		return nil, "Issuer field is missing";
	end
	if issClaim ~= appId then
		return nil, "Invalid application ID('iss' claim)";
	end

	local roomClaim = claims["room"];
	if roomClaim == nil then
		return nil, "Room field is missing";
	end
	if roomName ~= nil and roomName ~= roomClaim then
		return nil, "Invalid room name('room' claim)";
	end
	
	return true;
end

function _M.verify_password(password, appId, appSecret, roomName)
	return verify_password_impl(password, appId, appSecret, roomName);
end

return _M;
