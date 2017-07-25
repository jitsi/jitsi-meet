local jid = require "util.jid";
local runner, waiter = require "util.async".runner, require "util.async".waiter;

--- Finds and returns room by its jid
-- @param room_jid the room jid to search in the muc component
-- @return returns room if found or nil
function get_room_from_jid(room_jid)
    local _, host = jid.split(room_jid);
    local component = hosts[host];
    if component then
        local muc = component.modules.muc
        if muc and rawget(muc,"rooms") then
            -- We're running 0.9.x or 0.10 (old MUC API)
            return muc.rooms[room_jid];
        elseif muc and rawget(muc,"get_room_from_jid") then
            -- We're running >0.10 (new MUC API)
            return muc.get_room_from_jid(room_jid);
        else
            return
        end
    end
end


function wrap_async_run(event,handler)
    local result;
    local async_func = runner(function (event)
        local wait, done = waiter();
        result=handler(event);
        done();
        return result;
    end)
    async_func:run(event)
    return result;
end

return {
    get_room_from_jid = get_room_from_jid;
    wrap_async_run = wrap_async_run;
};