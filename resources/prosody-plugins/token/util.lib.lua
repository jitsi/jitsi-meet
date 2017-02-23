-- Token authentication
-- Copyright (C) 2015 Atlassian

local jwt = require "luajwtjitsi";

local _M = {};

local function _verify_token(token, appId, appSecret, disableRoomNameConstraints)

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

	return claims;
end

function _M.verify_token(token, appId, appSecret, disableRoomNameConstraints)
	return _verify_token(token, appId, appSecret, disableRoomNameConstraints);
end

return _M;
