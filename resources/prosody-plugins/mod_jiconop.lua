local st = require "util.stanza";
local get_services = module:depends("external_services").get_services;

-- Jitsi Connection Optimization
-- gathers needed information and pushes it with a message to clients
-- this way we skip 4 request responses during every client setup

local shard_name_config = module:get_option_string('shard_name');
if shard_name_config then
    module:add_identity("server", "shard", shard_name_config);
end

-- this is after xmpp-bind, the moment a client has resource and can be contacted
module:hook("resource-bind", function (event)
    local session = event.session;

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

    -- check whether room has lobby enabled and display name is required for those trying to join
    local lobby_muc_component_config = module:get_option_string('lobby_muc');
    module:context(lobby_muc_component_config):fire_event('host-disco-info-node',
            {origin = session; reply = query; node = 'lobbyrooms';});

    local stanza = st.message({
            from = module.host;
            to = session.full_jid; });
    stanza:add_child(query):up();

    --- get turnservers and credentials
    local services = get_services();
    stanza:tag("services");
    for _, srv in ipairs(services) do
        stanza:tag("service", srv):up();
    end

    session.send(stanza);
end);
