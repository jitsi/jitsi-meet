-- Jitsi session information
-- Copyright (C) 2021-present 8x8, Inc.
module:set_global();

local formdecode = require "util.http".formdecode;
local region_header_name = module:get_option_string('region_header_name', 'x_proxy_region');
local accept_token_from_query = module:get_option_boolean('accept_token_from_query', false);

if accept_token_from_query then
    module:log("warn", "Security configuration: accept_token_from_query is enabled. Tokens passed via URL query parameters are a security risk: they appear in server logs, browser history, and HTTP Referer headers.");
end

-- Extract the following parameters from the URL and set them in the session:
-- * previd: for session resumption
function init_session(event)
    local session, request = event.session, event.request;
    local query = request.url.query;

    local token = nil;

    -- extract token from Authorization header
    if request.headers["authorization"] then
        local auth_header = request.headers["authorization"];
        if auth_header:sub(1, 7):lower() == "bearer " then
            token = auth_header:sub(8, #auth_header);
        end
    end

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

        -- The following fields are filled in the session, by extracting them
        -- from the query and no validation is being done.
        -- After validating auth_token will be cleaned in case of error and few
        -- other fields will be extracted from the token and set in the session

        if params and params.token then
            if accept_token_from_query then
                -- Fallback to token from query parameter if explicitely enabled
                token = params.token;
            else
                module:log("warn", "Token auth via URL query parameter is disabled due to security risks. To enable it, set accept_token_from_query = true");
            end
        end

    end

    session.user_region = request.headers[region_header_name];

    -- in either case set auth_token in the session
    session.auth_token = token;
    session.user_agent_header = request.headers['user_agent'];
end

module:hook_global("bosh-session", init_session, 1);
module:hook_global("websocket-session", init_session, 1);
