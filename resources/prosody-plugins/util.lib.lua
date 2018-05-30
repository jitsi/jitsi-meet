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
    -- Grab a local response so that we can send the http response when
    -- the handler is done.
    local response = event.response;
    local async_func = runner(function (event)
          response.status_code = handler(event);
          -- Send the response to the waiting http client.
          response:send();
    end)
    async_func:run(event)
    -- return true to keep the client http connection open.
    return true;
end

--- Updates presence stanza, by adding identity node
-- @param stanza the presence stanza
-- @param user the user to which presence we are updating identity
-- @param group the group of the user to which presence we are updating identity
-- @param creator_user the user who created the user which presence we
-- are updating (this is the poltergeist case, where a user creates
-- a poltergeist), optional.
-- @param creator_group the group of the user who created the user which
-- presence we are updating (this is the poltergeist case, where a user creates
-- a poltergeist), optional.
function update_presence_identity(
    stanza, user, group, creator_user, creator_group)

    -- First remove any 'identity' element if it already
    -- exists, so it cannot be spoofed by a client
    stanza:maptags(
        function(tag)
            for k, v in pairs(tag) do
                if k == "name" and v == "identity" then
                    return nil
                end
            end
            return tag
        end
    )
    module:log("debug",
        "Presence after previous identity stripped: %s", tostring(stanza));

    stanza:tag("identity"):tag("user");
    for k, v in pairs(user) do
        stanza:tag(k):text(v):up();
    end
    stanza:up();

    -- Add the group information if it is present
    if group then
        stanza:tag("group"):text(group):up();
    end

    -- Add the creator user information if it is present
    if creator_user then
        stanza:tag("creator_user");
        for k, v in pairs(creator_user) do
            stanza:tag(k):text(v):up();
        end
        stanza:up();

        -- Add the creator group information if it is present
        if creator_group then
            stanza:tag("creator_group"):text(creator_group):up();
        end
        stanza:up();
    end

    module:log("debug",
        "Presence with identity inserted %s", tostring(stanza))
end

return {
    get_room_from_jid = get_room_from_jid;
    wrap_async_run = wrap_async_run;
    room_jid_match_rewrite = room_jid_match_rewrite;
    update_presence_identity = update_presence_identity;
};
