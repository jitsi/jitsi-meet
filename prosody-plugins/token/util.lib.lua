-- Token authentication
-- Copyright (C) 2015 Atlassian

local jwt = require "jwt";

local _M = {};

local function _get_room_name(token, appSecret)
	local claims, err = jwt.decode(token, appSecret);
	if claims ~= nil then
		return claims["room"];
	else
		return nil, err;
	end
end

local function _verify_token(token, appId, appSecret, roomName, disableRoomNameConstraints)

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
	if roomName ~= nil and roomName ~= roomClaim and disableRoomNameConstraints ~= true then
		return nil, "Invalid room name('room' claim)";
	end

	return true;
end

function _M.verify_token(token, appId, appSecret, roomName, disableRoomNameConstraints)
	return _verify_token(token, appId, appSecret, roomName, disableRoomNameConstraints);
end

function _M.get_room_name(token, appSecret)
	return _get_room_name(token, appSecret);
end

return _M;
