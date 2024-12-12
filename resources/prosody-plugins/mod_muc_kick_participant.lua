-- http endpoint to kick participants, access is based on provided jwt token
-- the correct jigasi we fined based on the display name and the number provided
-- Copyright (C) 2023-present 8x8, Inc.

local util = module:require "util";
local async_handler_wrapper = util.async_handler_wrapper;
local is_sip_jigasi = util.is_sip_jigasi;
local starts_with = util.starts_with;
local formdecode = require "util.http".formdecode;
local urlencode = require "util.http".urlencode;
local jid = require "util.jid";
local json = require 'cjson.safe';

local muc_domain_prefix = module:get_option_string("muc_mapper_domain_prefix", "conference");

local muc_domain_base = module:get_option_string("muc_mapper_domain_base");
if not muc_domain_base then
    module:log("warn", "No 'muc_domain_base' option set, disabling kick check endpoint.");
    return ;
end

local json_content_type = "application/json";

local token_util = module:require "token/util".new(module);

local asapKeyServer = module:get_option_string('prosody_password_public_key_repo_url', '');
if asapKeyServer == '' then
    module:log('warn', 'No "prosody_password_public_key_repo_url" option set, disabling kick endpoint.');
    return ;
end

token_util:set_asap_key_server(asapKeyServer);

--- Verifies the token
-- @param token the token we received
-- @param room_address the full room address jid
-- @return true if values are ok or false otherwise
function verify_token(token, room_address)

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

function handle_kick_participant (event)
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

    local number = params["number"];
    local participantId = params["participantId"];

    if (not number and not participantId) or (number and participantId) then
        module:log("warn", "Invalid parameters: exactly one of 'number' or 'participantId' must be provided.");
        return { status_code = 400; };
    end

    local error_code, room = validate_and_get_room(request);

    if error_code and error_code ~= 200 then
        module:log("error", "Error validating %s", error_code);
        return { error_code = 400; }
    end

    if not room then
        return { status_code = 404; }
    end

    for _, occupant in room:each_occupant() do
        local pr = occupant:get_presence();

        if is_participant_match(pr, number, participantId) then
            room:set_role(true, occupant.nick, nil);
            module:log('info', 'Occupant kicked %s from %s', occupant.nick, room.jid);
            return { status_code = 200; }
        end
    end

    -- not found participant to kick
    return { status_code = 404; };
end

function is_participant_match(pr, number, participantId)
    if number then
        local displayName = pr:get_child_text('nick', 'http://jabber.org/protocol/nick');
        return is_sip_jigasi(pr) and displayName and starts_with(displayName, number);
    elseif participantId then
        local from = pr.attr.from;
        local _, _, from_resource = jid.split(from);
        if from_resource then
            return from_resource == participantId;
        end
    end
    return false;
end

module:log("info","Adding http handler for /kick-participant on %s", module.host);
module:depends("http");
module:provides("http", {
    default_path = "/";
    route = {
        ["PUT kick-participant"] = function (event) return async_handler_wrapper(event, handle_kick_participant) end;
    };
});
