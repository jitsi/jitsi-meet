-- Jitsi session information
-- Copyright (C) 2021-present 8x8, Inc.
module:set_global();

local formdecode = require "util.http".formdecode;

-- Extract the following parameters from the URL and set them in the session:
-- * previd: for session resumption
function init_session(event)
    local session, request = event.session, event.request;
    local query = request.url.query;

    if query ~= nil then
        local params = formdecode(query);

        -- previd is used together with https://modules.prosody.im/mod_smacks.html
        -- the param is used to find resumed session and re-use anonymous(random) user id
        session.previd = query and params.previd or nil;

        -- customusername can be used with combination with "pre-jitsi-authentication" event to pre-set a known jid to a session
        session.customusername = query and params.customusername or nil;

        -- The room name and optional prefix from the web query
        session.jitsi_web_query_room = params.room;
        session.jitsi_web_query_prefix = params.prefix or "";
    end
end

module:hook_global("bosh-session", init_session);
module:hook_global("websocket-session", init_session);
