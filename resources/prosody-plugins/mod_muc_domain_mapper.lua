-- Maps MUC JIDs like room1@muc.foo.example.com to JIDs like [foo]room1@muc.example.com
-- Must be loaded on the client host in Prosody

-- It is recommended to set muc_mapper_domain_base to the main domain being served (example.com)

local filters = require "util.filters";

local muc_domain_base = module:get_option_string("muc_mapper_domain_base");
if not muc_domain_base then
    module:log("warn", "No 'muc_mapper_domain_base' option set, disabling muc_mapper plugin inactive");
    return
end

local util = module:require "util";
local room_jid_match_rewrite = util.room_jid_match_rewrite;
local internal_room_jid_match_rewrite = util.internal_room_jid_match_rewrite;

-- We must filter stanzas in order to hook in to all incoming and outgoing messaging which skips the stanza routers
function filter_stanza(stanza)
    if stanza.skipMapping then
        return stanza;
    end

    if stanza.name == "message" or stanza.name == "iq" or stanza.name == "presence" then
        -- module:log("debug", "Filtering stanza type %s  to %s from %s",stanza.name,stanza.attr.to,stanza.attr.from);
        if stanza.name == "iq" then
            local conf = stanza:get_child('conference')
            if conf then
                -- module:log("debug", "Filtering stanza conference %s to %s from %s",conf.attr.room,stanza.attr.to,stanza.attr.from);
                conf.attr.room = room_jid_match_rewrite(conf.attr.room, stanza)
            end
        end
        if stanza.attr.to then
            stanza.attr.to = room_jid_match_rewrite(stanza.attr.to, stanza)
        end
        if stanza.attr.from then
            stanza.attr.from = internal_room_jid_match_rewrite(stanza.attr.from, stanza)
        end
    end
    return stanza;
end

function filter_session(session)
    -- module:log("warn", "Session filters applied");
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
        stanza.attr.to = room_jid_match_rewrite(stanza.attr.to, stanza)
    end
end

local function incoming_stanza_rewriter(event)
    local stanza = event.stanza;
    if stanza.attr.from then
        stanza.attr.from = internal_room_jid_match_rewrite(stanza.attr.from, stanza)
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
