-- A global module which can be used as http endpoint to send system chat messages to meeting participants. The provided token
--- in the request is verified whether it has the right to do so.
-- Copyright (C) 2024-present 8x8, Inc.

-- curl https://{host}/send-system-message  -d '{"message": "testmessage", "to": "{connection_jid}", "room": "{room_jid}"}' -H "content-type: application/json" -H "authorization: Bearer {token}"

module:set_global();

local util = module:require "util";

local async_handler_wrapper = util.async_handler_wrapper;
local room_jid_match_rewrite = util.room_jid_match_rewrite;
local starts_with = util.starts_with;
local get_room_from_jid = util.get_room_from_jid;

local st = require "util.stanza";
local json = require "util.json";
local inspect = require 'inspect';

-- will be initialized once the main virtual host module is initialized
local token_util;

local muc_domain_base = module:get_option_string("muc_mapper_domain_base");
local asapKeyServer = module:get_option_string("prosody_password_public_key_repo_url", "");

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

function handle_send_system_message (event)
    local request = event.request;

    module:log("info", "Request for sending a system message received: reqid %s", request.headers["request_id"])

    -- verify payload
    if request.headers.content_type ~= "application/json"
            or (not request.body or #request.body == 0) then
        module:log("error", "Wrong content type: %s or missing payload", request.headers.content_type);
        return { status_code = 400; }
    end

    local payload = json.decode(request.body);

    module:log('info', 'Received payload %s', inspect(payload))

    local message = payload["message"];
    local to = payload["to"];
    local payload_room = payload["room"];

    if not message or not to or not payload_room then
        module:log("error", "One of [message, to, room] was not provided");
        return { status_code = 400; }
    end

    local room_jid = room_jid_match_rewrite(payload_room);
    local room = get_room_from_jid(room_jid);

    if not room then
        module:log("error", "Room %s not found", room_jid);
        return { status_code = 404; }
    end

    -- verify access
    local token = request.headers["authorization"]
    if not token then
        module:log("error", "Authorization header was not provided for conference %s", room_jid)
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

    local data = {
        type = "system_chat_message",
        message = message,
    };

    local stanza = st.message({
        from = room.jid,
        to = to
    })
    :tag('json-message', { xmlns = 'http://jitsi.org/jitmeet' })
    :text(json.encode(data))
    :up();

    room:route_stanza(stanza);

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

        module:log("info", "Adding http handler for /send-system-chat-message on %s", host_module.host);
        host_module:depends("http");
        host_module:provides("http", {
            default_path = "/";
            route = {
                ["POST send-system-chat-message"] = function(event)
                    return async_handler_wrapper(event, handle_send_system_message)
                end;
            };
        });
    end
end
