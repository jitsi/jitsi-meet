local inspect = require "inspect";
local formdecode = require "util.http".formdecode;
local urlencode = require "util.http".urlencode;
local jid = require "util.jid";
local json = require 'cjson.safe';
local util = module:require "util";
local async_handler_wrapper = util.async_handler_wrapper;
local starts_with = util.starts_with;
local process_host_module = util.process_host_module;
local token_util = module:require "token/util".new(module);

-- option to enable/disable room API token verifications
local enableTokenVerification
= module:get_option_boolean("enable_password_token_verification", true);

local muc_domain_base = module:get_option_string("muc_mapper_domain_base");
if not muc_domain_base then
    module:log("warn", "No 'muc_domain_base' option set, disabling password check endpoint.");
    return ;
end
local muc_domain_prefix = module:get_option_string("muc_mapper_domain_prefix", "conference");

local json_content_type = "application/json";

--- Verifies the token
-- @param token the token we received
-- @param room_address the full room address jid
-- @return true if values are ok or false otherwise
function verify_token(token, room_address)
    if not enableTokenVerification then
        return true;
    end

    -- if enableTokenVerification is enabled and we do not have token
    -- stop here, cause the main virtual host can have guest access enabled
    -- (allowEmptyToken = true) and we will allow access to rooms info without
    -- a token
    if token == nil then
        module:log("warn", "no token provided for %s", room_address);
        return false;
    end

    local session = {};
    session.auth_token = token;
    local verified, reason, msg = token_util:process_and_verify_token(session);
    if not verified then
        module:log("warn", "not a valid token %s %s for %s", tostring(reason), tostring(msg), room_address);
        return false;
    end

    return true;
end

-- Validates the request by checking for required url param room and
-- validates the token provided with the request
-- @param request - The request to validate.
-- @return [error_code, room]
local function validate_and_get_room(request)
    if not request.url.query then
        module:log("warn", "No query");
        return 400, nil;
    end

    local params = formdecode(request.url.query);
    local room_name = urlencode(params.room) or "";
    local subdomain = urlencode(params.prefix) or "";

    if not room_name then
        module:log("warn", "Missing room param for %s", room_name);
        return 400, nil;
    end

    local room_address = jid.join(room_name, muc_domain_prefix.."."..muc_domain_base);

    if subdomain and subdomain ~= "" then
        room_address = "["..subdomain.."]"..room_address;
    end

    -- verify access
    local token = request.headers["authorization"]

    if token and starts_with(token,'Bearer ') then
        token = token:sub(8,#token)
    end

    if not verify_token(token, room_address) then
        return 403, nil;
    end

    local room = get_room_from_jid(room_address);

    if not room then
        module:log("warn", "No room found for %s", room_address);
        return 404, nil;
    else
        return 200, room;
    end
end

function handle_validate_room_password (event)
    local request = event.request;

    if request.headers.content_type ~= json_content_type
            or (not request.body or #request.body == 0) then
        module:log("warn", "Wrong content type: %s", request.headers.content_type);
        return { status_code = 400; }
    end

    local params, error = json.decode(request.body);
    if not params then
        module:log("warn", "Missing params error:%s", error);
        return { status_code = 400; }
    end

    local passcode = params["passcode"];

    if not passcode then
        module:log("warn", "Missing passcode param");
        return { status_code = 400; };
    end

    local error_code, room = validate_and_get_room(request);

    if not room then
        return { status_code = error_code; }
    end

    local json_msg_str, error_encode = json.encode({ valid = (room:get_password() == passcode) });
    if not json_msg_str then
        module:log('error', 'Cannot encode json room:%s error:%s', room.jid, error_encode);
        return { status_code = 400; };
    end

    local PUT_response = {
        headers = { content_type = "application/json"; };
        body = json_msg_str;
    };

    -- module:log("debug","Sending response for room password validate: %s", inspect(PUT_response));

    return PUT_response;
end

--- Handles request for retrieving the room participants details
-- @param event the http event, holds the request query
-- @return GET response, containing a json with participants details
function handle_get_room_password (event)
    local error_code, room = validate_and_get_room(event.request);

    if not room then
        return { status_code = error_code; }
    end

    room_details = {};
    room_details["conference"] = room.jid;
    room_details["passcodeProtected"] = room:get_password() ~= nil;
    room_details["lobbyEnabled"] = room._data ~= nil and room._data.lobbyroom ~= nil;

    local json_msg_str, error = json.encode(room_details);
    if not json_msg_str then
        module:log('error', 'Cannot encode json room:%s error:%s', room.jid, error);
        return { status_code = 400; };
    end

    local GET_response = {
        headers = {
            content_type = "application/json";
        };
        body = json_msg_str;
    };
    -- module:log("debug","Sending response for room password: %s", inspect(GET_response));

    return GET_response;
end

process_host_module(muc_domain_base, function(host_module, host)
    module:log("info","Adding http handler for /room-info on %s", host_module.host);
    host_module:depends("http");
    host_module:provides("http", {
        default_path = "/";
        route = {
            ["GET room-info"] = function (event) return async_handler_wrapper(event, handle_get_room_password) end;
            ["PUT room-info"] = function (event) return async_handler_wrapper(event, handle_validate_room_password) end;
        };
    });
end);
