-- Maps MUC JIDs like room1@muc.foo.example.com to JIDs like [foo]room1@muc.example.com
-- Must be loaded on the client host in Prosody

-- It is recommended to set muc_mapper_domain_base to the main domain being served (example.com)

local jid = require "util.jid";

local filters = require "util.filters";

local muc_domain_prefix = module:get_option_string("muc_mapper_domain_prefix", "conference");

local muc_domain_base = module:get_option_string("muc_mapper_domain_base");
if not muc_domain_base then
    module:log("warn", "No 'muc_mapper_domain_base' option set, disabling muc_mapper plugin inactive");
    return
end

-- The "real" MUC domain that we are proxying to
local muc_domain = module:get_option_string("muc_mapper_domain", muc_domain_prefix.."."..muc_domain_base);

local escaped_muc_domain_base = muc_domain_base:gsub("%p", "%%%1");
local escaped_muc_domain_prefix = muc_domain_prefix:gsub("%p", "%%%1");
-- The pattern used to extract the target subdomain (e.g. extract 'foo' from 'foo.muc.example.com')
local target_subdomain_pattern = "^"..escaped_muc_domain_prefix..".([^%.]+)%."..escaped_muc_domain_base;

-- table to store all incoming iqs without roomname in it, like discoinfo to the muc compoent
local roomless_iqs = {};

if not muc_domain then
    module:log("warn", "No 'muc_mapper_domain' option set, disabling muc_mapper plugin inactive");
    return
end


-- Utility function to check and convert a room JID from virtual room1@muc.foo.example.com to real [foo]room1@muc.example.com
local function match_rewrite_to_jid(room_jid, stanza)
    local node, host, resource = jid.split(room_jid);
    local target_subdomain = host and host:match(target_subdomain_pattern);
    if not target_subdomain then
        module:log("debug", "No need to rewrite out 'to' %s", room_jid);
        return room_jid;
    end
    -- Ok, rewrite room_jid  address to new format
    local new_node, new_host, new_resource;
    if node then
        new_node, new_host, new_resource = "["..target_subdomain.."]"..node, muc_domain, resource;
    else
        module:log("debug", "No room name provided so rewriting only host 'to' %s", room_jid);
        new_host, new_resource = muc_domain, resource;

        if (stanza.attr and stanza.attr.id) then
            roomless_iqs[stanza.attr.id] = stanza.attr.to;
        end
    end
    room_jid = jid.join(new_node, new_host, new_resource);
    module:log("debug", "Rewrote to %s", room_jid);
    return room_jid
end

-- Utility function to check and convert a room JID from real [foo]room1@muc.example.com to virtual room1@muc.foo.example.com
local function match_rewrite_from_jid(room_jid, stanza)
    local node, host, resource = jid.split(room_jid);
    if host ~= muc_domain or not node then
        module:log("debug", "No need to rewrite %s (not from the MUC host) %s, %s", room_jid, stanza.attr.id, roomless_iqs[stanza.attr.id]);

        if (stanza.attr and stanza.attr.id and roomless_iqs[stanza.attr.id]) then
            local result = roomless_iqs[stanza.attr.id];
            roomless_iqs[stanza.attr.id] = nil;
            return result;
        end

        return room_jid;
    end
    local target_subdomain, target_node = node:match("^%[([^%]]+)%](.+)$");
    if not (target_node and target_subdomain) then
        module:log("debug", "Not rewriting... unexpected node format: %s", node);
        return room_jid;
    end
    -- Ok, rewrite room_jid address to pretty format
    local new_node, new_host, new_resource = target_node, muc_domain_prefix..".".. target_subdomain.."."..muc_domain_base, resource;
    room_jid = jid.join(new_node, new_host, new_resource);
    module:log("debug", "Rewrote to %s", room_jid);
    return room_jid
end


-- We must filter stanzas in order to hook in to all incoming and outgoing messaging which skips the stanza routers
function filter_stanza(stanza)
    if stanza.name == "message" or stanza.name == "iq" or stanza.name == "presence" then
        module:log("debug", "Filtering stanza type %s  to %s from %s",stanza.name,stanza.attr.to,stanza.attr.from);
        if stanza.name == "iq" then
            local conf = stanza:get_child('conference')
            if conf then
                module:log("debug", "Filtering stanza conference %s to %s from %s",conf.attr.room,stanza.attr.to,stanza.attr.from);
                conf.attr.room = match_rewrite_to_jid(conf.attr.room, stanza)
            end
        end
        if stanza.attr.to then
            stanza.attr.to = match_rewrite_to_jid(stanza.attr.to, stanza)
        end
        if stanza.attr.from then
            stanza.attr.from = match_rewrite_from_jid(stanza.attr.from, stanza)
        end
    end
    return stanza;
end

function filter_session(session)
    module:log("warn", "Session filters applied");
--    filters.add_filter(session, "stanzas/in", filter_stanza_in);
    filters.add_filter(session, "stanzas/out", filter_stanza);
end

function module.load()
    if module.reloading then
        module:log("debug", "Reloading MUC mapper!");
    else
        module:log("debug", "First load of MUC mapper!");
    end
    filters.add_filter_hook(filter_session);
end

function module.unload()
    filters.remove_filter_hook(filter_session);
end


local function outgoing_stanza_rewriter(event)
    local stanza = event.stanza;
    if stanza.attr.to then
        stanza.attr.to = match_rewrite_to_jid(stanza.attr.to, stanza)
    end
end

local function incoming_stanza_rewriter(event)
    local stanza = event.stanza;
    if stanza.attr.from then
        stanza.attr.from = match_rewrite_from_jid(stanza.attr.from, stanza)
    end
end

-- The stanza rewriters helper functions are attached for all stanza router hooks
local function hook_all_stanzas(handler, host_module, event_prefix)
    for _, stanza_type in ipairs({ "message", "presence", "iq" }) do
        for _, jid_type in ipairs({ "host", "bare", "full" }) do
            host_module:hook((event_prefix or "")..stanza_type.."/"..jid_type, handler);
        end
    end
end

function add_host(host)
    module:log("info", "Loading mod_muc_domain_mapper for host %s!", host);
    local host_module = module:context(host);
    hook_all_stanzas(incoming_stanza_rewriter, host_module);
    hook_all_stanzas(outgoing_stanza_rewriter, host_module, "pre-");
end

prosody.events.add_handler("host-activated", add_host);
for host in pairs(prosody.hosts) do
    add_host(host);
end
