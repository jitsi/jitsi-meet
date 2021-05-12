local formdecode = require 'util.http'.formdecode;

local avmoderation_component = module:get_option_string('av_moderation_component', 'avmoderation'..module.host);

-- Advertise AV Moderation so client can pick up the address and use it
module:add_identity('component', 'av_moderation', avmoderation_component);

-- Extract 'room' param from URL when session is created
function update_session(event)
    local session = event.session;

    if session.jitsi_web_query_room then
        -- no need for an update
        return;
    end

    local query = event.request.url.query;
    if query ~= nil then
        local params = formdecode(query);
        -- The room name and optional prefix from the web query
        session.jitsi_web_query_room = params.room;
        session.jitsi_web_query_prefix = params.prefix or '';
    end
end
module:hook_global('bosh-session', update_session);
module:hook_global('websocket-session', update_session);
