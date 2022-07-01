local jid = require "util.jid";
local json = require "util.json";
local async_handler_wrapper = module:require "util".async_handler_wrapper;
local room_jid_match_rewrite = module:require "util".room_jid_match_rewrite;
local starts_with = module:require "util".starts_with;
local token_util = module:require "token/util".new(module);
local inspect = require "inspect";
local parse = require "net.url".parseQuery;


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

--- Verifies room name, domain name with the values in the token
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

function handle_validate_room_password (event)
    local request = event.request;
    module:log("info","Request for room password validate: reqid %s", request.headers["request_id"])

    if request.headers.content_type ~= json_content_type
            or (not request.body or #request.body == 0) then
        module:log("warn", "Wrong content type: %s", request.headers.content_type);
        return 400;
    end

    local params = json.decode(event.request.body);
    if not params then
        module:log("warn", "Missing params");
        return 400;
    end

    local conference = params["conferenceFullName"];
    local passcode = params["passcode"];

    if (not conference or not passcode) then
        module:log("warn", "Missing conference or passcode param");
        return 400;
    end

    local room_address = room_jid_match_rewrite(conference)

    -- verify access
    local token = event.request.headers["authorization"]

    if token and starts_with(token,'Bearer ') then
        token = token:sub(8,#token)
    end

    if not verify_token(token, room_address) then
        return 403;
    end

    local room = get_room_from_jid(room_address);

    response_data = {};
    local PUT_response = {
        headers = { content_type = "application/json"; };
    };
    if room then
        response_data["valid"] = room:get_password() == passcode;
    else
        response_data["valid"] = false;

        -- no room found but everything else was valid
        PUT_response.status_code = 404;
    end

    PUT_response.body = json.encode(response_data);
    module:log("debug","Sending response for room password validate: %s", inspect(PUT_response));

    return PUT_response;

end

--- Handles request for retrieving the room participants details
-- @param event the http event, holds the request query
-- @return GET response, containing a json with participants details
function handle_get_room_password (event)
    module:log("info","Request for room password received: reqid %s", event.request.headers["request_id"])
    if (not event.request.url.query) then
        module:log("warn", "No query");
        return 400;
    end
    local params = parse(event.request.url.query);
    local room_name = params["room"];
    local domain_name = params["domain"];
    local subdomain = params["subdomain"];
    local conference = params["conferenceFullName"];

    local room_address;

    if (not conference) and ((not room_name) or (not domain_name)) then
        module:log("warn", "Missing param conference or room_name and domain_name");
        return 400;
    end

    if conference then
        room_address = room_jid_match_rewrite(conference)
    else
        room_address = jid.join(room_name, muc_domain_prefix.."."..domain_name);

        if subdomain and subdomain ~= "" then
            room_address = "["..subdomain.."]"..room_address;
        end
    end


    -- verify access
    local token = event.request.headers["authorization"]

    if token and starts_with(token,'Bearer ') then
        token = token:sub(8,#token)
    end

    if not verify_token(token, room_address) then
        return 403;
    end

        local room = get_room_from_jid(room_address);

    if room then
        room_details = {};
        room_details["conference"] = room_address;
        room_details["passcodeProtected"] = room:get_password() ~= nil;
        room_details["lobbyEnabled"] = room._data ~= nil and room._data.lobbyroom ~= nil;

        local GET_response = {
            headers = {
                content_type = "application/json";
            };
            body = json.encode(room_details);
        };
        module:log("debug","Sending response for room password: %s", inspect(GET_response));

        return GET_response;
    end

    -- default case, return 404
    return 404;
end

-- process a host module directly if loaded or hooks to wait for its load
function process_host_module(name, callback)
    local function process_host(host)
        if host == name then
            callback(module:context(host), host);
        end
    end

    if prosody.hosts[name] == nil then
        module:log('debug', 'No host/component found, will wait for it: %s', name)

        -- when a host or component is added
        prosody.events.add_handler('host-activated', process_host);
    else
        process_host(name);
    end
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
