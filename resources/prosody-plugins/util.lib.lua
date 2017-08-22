local jid = require "util.jid";
local runner, waiter = require "util.async".runner, require "util.async".waiter;

local muc_domain_prefix
    = module:get_option_string("muc_mapper_domain_prefix", "conference");

-- defaults to module.host, the module that uses the utility
local muc_domain_base
    = module:get_option_string("muc_mapper_domain_base", module.host);

-- The "real" MUC domain that we are proxying to
local muc_domain = module:get_option_string(
    "muc_mapper_domain", muc_domain_prefix.."."..muc_domain_base);

local escaped_muc_domain_base = muc_domain_base:gsub("%p", "%%%1");
local escaped_muc_domain_prefix = muc_domain_prefix:gsub("%p", "%%%1");
-- The pattern used to extract the target subdomain
-- (e.g. extract 'foo' from 'foo.muc.example.com')
local target_subdomain_pattern
    = "^"..escaped_muc_domain_prefix..".([^%.]+)%."..escaped_muc_domain_base;

--- Utility function to check and convert a room JID from
-- virtual room1@muc.foo.example.com to real [foo]room1@muc.example.com
-- @param room_jid the room jid to match and rewrite if needed
-- @return returns room jid [foo]room1@muc.example.com when it has subdomain
-- otherwise room1@muc.example.com(the room_jid value untouched)
local function room_jid_match_rewrite(room_jid)
    local node, host, resource = jid.split(room_jid);
    local target_subdomain = host and host:match(target_subdomain_pattern);
    if not target_subdomain then
        module:log("debug", "No need to rewrite out 'to' %s", room_jid);
        return room_jid;
    end
    -- Ok, rewrite room_jid  address to new format
    local new_node, new_host, new_resource
        = "["..target_subdomain.."]"..node, muc_domain, resource;
    room_jid = jid.join(new_node, new_host, new_resource);
    module:log("debug", "Rewrote to %s", room_jid);
    return room_jid
end


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
    room_jid_match_rewrite= room_jid_match_rewrite;
};