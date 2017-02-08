-- Copyright (c) 2015 &yet <https://andyet.com>
-- https://github.com/otalk/mod_muc_allowners/blob/9a86266a25ed32ade150742cc79f5a1669765a8f/mod_muc_allowners.lua
--
-- Used under the terms of the MIT License
-- https://github.com/otalk/mod_muc_allowners/blob/9a86266a25ed32ade150742cc79f5a1669765a8f/LICENSE

local muc_service = module:depends("muc");
local room_mt = muc_service.room_mt;


room_mt.get_affiliation = function (room, jid)
    return "owner";
end
