-- Automatically set some users as owner in MUC rooms.
--
-- In Jitsi Meet this makes it possible to not set jicofo as an admin.
--
-- Sample usage:
--
-- Component "muc.meet.jitsi" "muc"
--    modules_enabled = { "muc_setowner" };
--    muc_owner_list = { "focus@auth.meet.jitsi" }

local split_jid = require "util.jid".split;
local muc_service = module:depends("muc");
local room_mt = muc_service.room_mt;

local owner_list = module:get_option_set("muc_owner_list", {});

local original_get_affiliation = room_mt.get_affiliation;

room_mt.get_affiliation = function (room, jid)
    local user, domain, res = split_jid(jid);

    if owner_list:contains(user..'@'..domain) then
        return "owner"
    end

    return original_get_affiliation(room, jid);
end
