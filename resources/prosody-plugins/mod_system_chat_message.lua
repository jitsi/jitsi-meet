-- HTTP module that exposes a POST /send-system-chat-message endpoint for
-- delivering private system chat messages to specific participants in a MUC
-- room. Intended for internal system use (e.g. by a backend service), not for
-- end-user clients.
--
-- Authentication uses a SEPARATE ASAP key pair from the one used for login
-- tokens (mod_auth_token). The key server URL is read from
-- prosody_password_public_key_repo_url (not asap_key_server), so login tokens
-- are not accepted.
--
-- Request format:
--   POST /send-system-chat-message
--   Content-Type: application/json
--   Authorization: Bearer <system-token>
--   Body: {
--     "room":           "<room-jid>",
--     "connectionJIDs": ["<full-jid>", ...],
--     "message":        "<text>",
--     "displayName":    "<name>"           (optional)
--   }
--
-- Each JID in connectionJIDs receives a private <message> stanza from the
-- room JID containing a <json-message xmlns='http://jitsi.org/jitmeet'>
-- payload of the form:
--   { "type": "system_chat_message", "message": "...", "displayName": "..." }
--
-- Responses:
--   200  Messages dispatched.
--   400  Missing or invalid parameters / wrong Content-Type.
--   401  Missing, malformed, or unverifiable token.
--   404  Room not found.
--
-- Copyright (C) 2024-present 8x8, Inc.

local util = module:require "util";
local token_util = module:require "token/util".new(module);

local async_handler_wrapper = util.async_handler_wrapper;
local room_jid_match_rewrite = util.room_jid_match_rewrite;
local starts_with = util.starts_with;
local get_room_from_jid = util.get_room_from_jid;

local st = require "util.stanza";
local json = require "cjson.safe";

local asapKeyServer = module:get_option_string("prosody_password_public_key_repo_url", "");

if asapKeyServer then
    -- init token util with our asap keyserver
    token_util:set_asap_key_server(asapKeyServer)
end

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

    module:log("debug", "Request for sending a system message received: reqid %s", request.headers["request_id"])

    -- verify payload
    if request.headers.content_type ~= "application/json"
            or (not request.body or #request.body == 0) then
        module:log("error", "Wrong content type: %s or missing payload", request.headers.content_type);
        return { status_code = 400; }
    end

    local payload = json.decode(request.body);

    if not payload then
        module:log("error", "Request body is missing");
        return { status_code = 400; }
    end

    local displayName = payload["displayName"];
    local message = payload["message"];
    local connectionJIDs = payload["connectionJIDs"];
    local payload_room = payload["room"];

    if not message or not connectionJIDs or not payload_room then
        module:log("error", "One of [message, connectionJIDs, room] was not provided");
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
        displayName = displayName,
        type = "system_chat_message",
        message = message,
    };

    for _, to in ipairs(connectionJIDs) do
        local stanza = st.message({
            from = room.jid,
            to = to
        })
        :tag('json-message', { xmlns = 'http://jitsi.org/jitmeet' })
        :text(json.encode(data))
        :up();

        room:route_stanza(stanza);
    end

    return { status_code = 200 };
end

module:log("info", "Adding http handler for /send-system-chat-message on %s", module.host);
module:depends("http");
module:provides("http", {
    default_path = "/";
    route = {
        ["POST send-system-chat-message"] = function(event)
            return async_handler_wrapper(event, handle_send_system_message)
        end;
    };
});
