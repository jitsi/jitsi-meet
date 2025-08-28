-- A global module which can be used as http endpoint to end meetings. The provided token
--- in the request is verified whether it has the right to do so.
-- Copyright (C) 2023-present 8x8, Inc.

module:set_global();

local util = module:require "util";
local async_handler_wrapper = util.async_handler_wrapper;
local room_jid_match_rewrite = util.room_jid_match_rewrite;
local get_room_from_jid = util.get_room_from_jid;
local starts_with = util.starts_with;

local neturl = require "net.url";
local parse = neturl.parseQuery;

-- will be initialized once the main virtual host module is initialized
local token_util;

local muc_domain_base = module:get_option_string("muc_mapper_domain_base");

local asapKeyServer = module:get_option_string("prosody_password_public_key_repo_url", "");

local event_count = module:measure("muc_end_meeting_rate", "rate")
local event_count_success = module:measure("muc_end_meeting_success", "rate")

function verify_token(token)
    if token == nil then
        module:log("warn", "no token provided");
        return false;
    end

    local session = {};
    session.auth_token = token;
    local verified, reason, msg = token_util:process_and_verify_token(session);
    if not verified then
        module:log("warn", "not a valid token %s %s", tostring(reason), tostring(msg));
        return false;
    end
    return true;
end

function handle_terminate_meeting (event)
    module:log("info", "Request for terminate meeting received: reqid %s", event.request.headers["request_id"])
    event_count()
    if not event.request.url.query then
        return { status_code = 400 };
    end
    local params = parse(event.request.url.query);
    local conference = params["conference"];
    local room_jid;

    if conference then
        room_jid = room_jid_match_rewrite(conference)
    else
        module:log('warn', "conference param was not provided")
        return { status_code = 400 };
    end

    -- verify access
    local token = event.request.headers["authorization"]
    if not token then
        module:log("error", "Authorization header was not provided for conference %s", conference)
        return { status_code = 401 };
    end
    if starts_with(token, 'Bearer ') then
        token = token:sub(8, #token)
    else
        module:log("error", "Authorization header is invalid")
        return { status_code = 401 };
    end

    if not verify_token(token, room_jid) then
        return { status_code = 401 };
    end

    local room = get_room_from_jid(room_jid);
    if not room then
        module:log("warn", "Room not found")
        return { status_code = 404 };
    else
        module:log("info", "Destroy room jid %s", room.jid)
        room:destroy(nil, "The meeting has been terminated")
    end
    event_count_success()
    return { status_code = 200 };
end


-- module API called on virtual host added, passing the host module
function module.add_host(host_module)
    if host_module.host == muc_domain_base then
        -- the main virtual host
        module:log("info", "Initialize token_util using %s", host_module.host)

        token_util = module:require "token/util".new(host_module);

        if asapKeyServer then
            -- init token util with our asap keyserver
            token_util:set_asap_key_server(asapKeyServer)
        end

        module:log("info", "Adding http handler for /end-meeting on %s", host_module.host);
        host_module:depends("http");
        host_module:provides("http", {
            default_path = "/";
            route = {
                ["POST end-meeting"] = function(event)
                    return async_handler_wrapper(event, handle_terminate_meeting)
                end;
            };
        });
    end
end
