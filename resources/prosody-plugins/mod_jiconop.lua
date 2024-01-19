local st = require "util.stanza";
local ext_services = module:depends("external_services");
local get_services = ext_services.get_services;
local services_xml = ext_services.services_xml;

-- Jitsi Connection Optimization
-- gathers needed information and pushes it with a message to clients
-- this way we skip 4 request responses during every client setup

local shard_name_config = module:get_option_string('shard_name');
if shard_name_config then
    module:add_identity("server", "shard", shard_name_config);
end

local region_name_config = module:get_option_string('region_name');
if region_name_config then
    module:add_identity("server", "region", region_name_config);
end

local release_number_config = module:get_option_string('release_number');
if release_number_config then
    module:add_identity("server", "release", release_number_config);
end

-- we cache the query as server identities will not change dynamically, amd use its clone every time
local query_cache;

-- this is after xmpp-bind, the moment a client has resource and can be contacted
module:hook("resource-bind", function (event)
    local session = event.session;

    if query_cache == nil then
        -- disco info data / all identity and features
        local query = st.stanza("query", { xmlns = "http://jabber.org/protocol/disco#info" });
        local done = {};
        for _,identity in ipairs(module:get_host_items("identity")) do
            local identity_s = identity.category.."\0"..identity.type;
            if not done[identity_s] then
                query:tag("identity", identity):up();
                done[identity_s] = true;
            end
        end

        query_cache = query;
    end

    local query = st.clone(query_cache);

    -- check whether room has lobby enabled and display name is required for those trying to join
    local lobby_muc_component_config = module:get_option_string('lobby_muc');
    module:context(lobby_muc_component_config):fire_event('host-disco-info-node',
            {origin = session; reply = query; node = 'lobbyrooms';});

    -- will add a rename feature for breakout rooms.
    local breakout_rooms_muc_component_config = module:get_option_string('breakout_rooms_muc');
    if breakout_rooms_muc_component_config then
        module:context(breakout_rooms_muc_component_config):fire_event('host-disco-info-node',
                {origin = session; reply = query; node = 'breakout_rooms';});
    end

    local stanza = st.message({
            from = module.host;
            to = session.full_jid; });
    stanza:add_child(query):up();

    --- get turnservers and credentials
    stanza:add_child(services_xml(get_services()));

    session.send(stanza);
end);
