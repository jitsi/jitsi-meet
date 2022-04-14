local util = module:require "util";
local is_healthcheck_room = util.is_healthcheck_room;
local um_is_admin = require "core.usermanager".is_admin;
local jid_resource = require "util.jid".resource;

local function is_admin(_jid)
    return um_is_admin(_jid, module.host);
end

function starts_with(str, start)
    return str:sub(1, #start) == start
end

module:hook("muc-occupant-pre-join", function (event)
    local room, occupant = event.room, event.occupant;

    if is_healthcheck_room(room.jid) or is_admin(occupant.bare_jid) then
        return;
    end

    local nick = jid_resource(event.occupant.nick);
--     module:log('info', 'prejoin:%s %s', nick, starts_with(nick, 'damencho'));

    if starts_with(nick, 'damencho') then
        -- visitor
        occupant.role = 'visitor';
    end
end, 3);

-- module:hook("pre-stanza", function(event)
--     local stanza = event.stanza;
--
--     if stanza.name == "presence" then
-- --     string.find(stanza.attr.to, "damencho")
--         module:log('info', 'pre-stanza:%s %s', stanza.attr.to, stanza);
-- --         return true;
--     end
-- end);
