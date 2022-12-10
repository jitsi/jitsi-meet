--- AUTHOR: https://gist.github.com/legastero Lance Stout
local jid_split = require "util.jid".split;
local whitelist = module:get_option_set("muc_password_whitelist");

local MUC_NS = "http://jabber.org/protocol/muc";


module:hook("muc-occupant-pre-join", function (event)
    local room, stanza = event.room, event.stanza;

    local user, domain, res = jid_split(event.stanza.attr.from);

    --no user object means no way to check whitelist
    if user == nil then
      return
    end

    if not whitelist then
        return;
    end
    if not whitelist:contains(domain) and not whitelist:contains(user..'@'..domain) then
        return;
    end

    local join = stanza:get_child("x", MUC_NS);
    if not join then
        join = stanza:tag("x", { xmlns = MUC_NS });
    end

    local password = join:get_child("password", MUC_NS);
    if password then
        -- removes <password... node,
        -- seems like password:text( appends text, not replacing it
        join:maptags(
                function(tag)
                    for k, v in pairs(tag) do
                        if k == "name" and v == "password" then
                            return nil
                        end
                    end
                    return tag
                end
        );

    end

    join:tag("password", { xmlns = MUC_NS }):text(room:get_password());

    module:log("debug", "Applied password access whitelist for %s in room %s", event.stanza.attr.from, room.jid);
end, -7); --- Run before the password check (priority -20), runs after lobby(priority -4) and members-only (priority -5).


module:hook_global("config-reloaded", function (event)
    module:log("debug", "Reloading MUC password access whitelist");
    whitelist = module:get_option_set("muc_password_whitelist");
end)
