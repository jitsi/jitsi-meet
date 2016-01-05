-- Token authentication
-- Copyright (C) 2015 Atlassian

local jwt = require "luajwt";

local _M = {};

local function _get_room_name(token, appSecret)
	local claims, err = jwt.decode(token, appSecret);
	if claims ~= nil then
		return claims["room"];
	else
		return nil, err;
	end
end

local function _verify_token(token, appId, appSecret, roomName)

	local claims, err = jwt.decode(token, appSecret, true);
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

function _M.verify_token(token, appId, appSecret, roomName)
	return _verify_token(token, appId, appSecret, roomName);
end

function _M.get_room_name(token, appSecret)
	return _get_room_name(token, appSecret);
end

return _M;