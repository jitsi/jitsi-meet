local st = require "util.stanza";
local jid = require "util.jid";
local http = require "net.http";
local json = require "cjson";
local inspect = require('inspect');
local socket = require "socket";
local uuid_gen = require "util.uuid".generate;
local jwt = require "luajwtjitsi";
local it = require "util.iterators";
local neturl = require "net.url";
local parse = neturl.parseQuery;

local get_room_from_jid = module:require "util".get_room_from_jid;
local room_jid_match_rewrite = module:require "util".room_jid_match_rewrite;
local is_healthcheck_room = module:require "util".is_healthcheck_room;

local async_handler_wrapper = module:require "util".async_handler_wrapper;

-- this basically strips the domain from the conference.domain address
local parentHostName = string.gmatch(tostring(module.host), "%w+.(%w.+)")();
if parentHostName == nil then
    log("error", "Failed to start - unable to get parent hostname");
    return;
end

local parentCtx = module:context(parentHostName);
if parentCtx == nil then
    log("error",
        "Failed to start - unable to get parent context for host: %s",
        tostring(parentHostName));
    return;
end
local token_util = module:require "token/util".new(parentCtx);


local ASAPKeyPath
    = module:get_option_string("asap_key_path", '/etc/prosody/certs/asap.key');

local ASAPKeyId
    = module:get_option_string("asap_key_id", 'jitsi');

local ASAPIssuer
    = module:get_option_string("asap_issuer", 'jitsi');

local ASAPAudience
    = module:get_option_string("asap_audience", 'jibriqueue');

local ASAPTTL
    = module:get_option_number("asap_ttl", 3600);

local ASAPTTL_THRESHOLD
    = module:get_option_number("asap_ttl_threshold", 600);

local ASAPKey;

local queueServiceURL
    = module:get_option_string("jibri_queue_url");

if queueServiceURL == nil then
    log("error", "No jibri_queue_url specified. No service to contact!");
    return;
end


local http_headers = {
    ["User-Agent"] = "Prosody ("..prosody.version.."; "..prosody.platform..")",
    ["Content-Type"] = "application/json"
};

-- we use async to detect Prosody 0.10 and earlier
local have_async = pcall(require, "util.async");
if not have_async then
    module:log("warn", "conference duration will not work with Prosody version 0.10 or less.");
    return;
end

local muc_component_host = module:get_option_string("muc_component");
if muc_component_host == nil then
    log("error", "No muc_component specified. No muc to operate on for jibri queue!");
    return;
end

log("info", "Starting jibri queue handling for %s", muc_component_host);

-- Read ASAP key once on module startup
local f = io.open(ASAPKeyPath, "r");
if f then
    ASAPKey = f:read("*all");
    f:close();
    if not ASAPKey then
        module:log("warn", "No ASAP Key read, disabling muc_events plugin");
        return
    end
else
    module:log("warn", "Error reading ASAP Key, disabling muc_events plugin");
    return
end

-- TODO: Figure out a less arbitrary default cache size.
local jwtKeyCacheSize = module:get_option_number("jwt_pubkey_cache_size", 128);
local jwtKeyCache = require"util.cache".new(jwtKeyCacheSize);

local function round(num, numDecimalPlaces)
    local mult = 10^(numDecimalPlaces or 0)
    return math.floor(num * mult + 0.5) / mult
end
      
local function generateToken(audience)
    audience = audience or ASAPAudience
    local t = os.time()
    local err
    local exp_key = 'asap_exp.'..audience
    local token_key = 'asap_token.'..audience
    local exp = jwtKeyCache:get(exp_key)
    local token = jwtKeyCache:get(token_key)

    --if we find a token and it isn't too far from expiry, then use it
    if token ~= nil and exp ~= nil then
        exp = tonumber(exp)
        if (exp - t) > ASAPTTL_THRESHOLD then
            return token
        end
    end

    --expiry is the current time plus TTL
    exp = t + ASAPTTL
    local payload = {
        iss = ASAPIssuer,
        aud = audience,
        nbf = t,
        exp = exp,
    }

    -- encode
    local alg = "RS256"
    token, err = jwt.encode(payload, ASAPKey, alg, {kid = ASAPKeyId})
    if not err then
        token = 'Bearer '..token
        jwtKeyCache:set(exp_key,exp)
        jwtKeyCache:set(token_key,token)
        return token
    else
        return ''
    end
end


local function cb(content_, code_, response_, request_)
    if code_ == 200 or code_ == 204 then
        module:log("debug", "URL Callback: Code %s, Content %s, Request (host %s, path %s, body %s), Response: %s",
                code_, content_, request_.host, request_.path, inspect(request_.body), inspect(response_));
    else
        module:log("warn", "URL Callback non successful: Code %s, Content %s, Request (%s), Response: %s",
                code_, content_, inspect(request_), inspect(response_));
    end
end

local function sendEvent(type,room_address,participant,edetails)
    local event_ts = round(socket.gettime()*1000);
    local out_event = {
        ["conference"] = room_address,
        ["event_type"] = "Event"..type,
        ["participant"] = participant,
        ["event_details"] = edetails,
        ["event_ts"] = event_ts
    }
    module:log("debug","Sending event %s",inspect(out_event));

    local headers = http_headers or {}
    headers['Authorization'] = generateToken()

    module:log("debug","Sending headers %s",inspect(headers));
    local request = http.request(queueServiceURL, {
        headers = headers,
        method = "POST",
        body = json.encode(out_event)
    }, cb);
end

-- receives messages from client currently connected to the room
-- clients indicates their own dominant speaker events
function on_message(event)
    -- Check the type of the incoming stanza to avoid loops:
    if event.stanza.attr.type == "error" then
        return; -- We do not want to reply to these, so leave.
    end

    local jibriQueue
        = jibriQueue.stanza:get_child('jibriqueue', 'http://jitsi.org/jitmeet');
    if jibriQueue then
        local roomAddress = jibriQueue.attr.room;
        local room = get_room_from_jid(room_jid_match_rewrite(roomAddress));

        if not room then
            log("warn", "No room found %s", roomAddress);
            return false;
        end

        local from = event.stanza.attr.from;

        local occupant = room:get_occupant_by_real_jid(from);
        if not occupant then
            log("warn", "No occupant %s found for %s", from, roomAddress);
            return false;
        end
        -- now handle new jibri queue message
        local edetails = {
            ["foo"] = "bar"
        }
        sendEvent('Message',roomAddress,from,edetails)
    end
    return true
end

function occupant_joined(event)
    local room = event.room;
    local occupant = event.occupant;

    if is_healthcheck_room(room.jid) then
        return;
    end

    local participant_count = it.count(room:each_occupant());

    -- now handle new jibri queue message
    local edetails = {
        ["participant_count"] = participant_count
    }
    sendEvent('Join',room.jid,occupant.jid,edetails)
end

module:hook("message/host", on_message);

-- executed on every host added internally in prosody, including components
function process_host(host)
    if host == muc_component_host then -- the conference muc component
        module:log("info","Hook to muc events on %s", host);

        local muc_module = module:context(host);
        -- muc_module:hook("muc-room-created", room_created, -1);
        muc_module:hook("muc-occupant-joined", occupant_joined, -1);
        -- muc_module:hook("muc-occupant-pre-leave", occupant_leaving, -1);
        -- muc_module:hook("muc-room-destroyed", room_destroyed, -1);
    end
end

if prosody.hosts[muc_component_host] == nil then
    module:log("info","No muc component found, will listen for it: %s", muc_component_host)

    -- when a host or component is added
    prosody.events.add_handler("host-activated", process_host);
else
    process_host(muc_component_host);
end

module:log("info", "Loading jibri_queue_component");

--- Verifies room name, domain name with the values in the token
-- @param token the token we received
-- @param room_name the room name
-- @param group name of the group (optional)
-- @param session the session to use for storing token specific fields
-- @return true if values are ok or false otherwise
function verify_token(token, room_name, group, session)
    if disableTokenVerification then
        return true;
    end

    -- if not disableTokenVerification and we do not have token
    -- stop here, cause the main virtual host can have guest access enabled
    -- (allowEmptyToken = true) and we will allow access to rooms info without
    -- a token
    if token == nil then
        log("warn", "no token provided");
        return false;
    end

    session.auth_token = token;
    local verified, reason = token_util:process_and_verify_token(session);
    if not verified then
        log("warn", "not a valid token %s", tostring(reason));
        return false;
    end

    local room_address = jid.join(room_name, module:get_host());
    -- if there is a group we are in multidomain mode and that group is not
    -- our parent host
    if group and group ~= "" and group ~= parentHostName then
        room_address = "["..group.."]"..room_address;
    end

    if not token_util:verify_room(session, room_address) then
        log("warn", "Token %s not allowed to join: %s",
            tostring(token), tostring(room_address));
        return false;
    end

    return true;
end

--- Handles request for updating jibri queue status
-- @param event the http event, holds the request query
-- @return GET response, containing a json with response details
function handle_update_jibri_queue (event)
    if (not event.request.url.query) then
        return { status_code = 400; };
    end

    local params = parse(event.request.url.query);
    local user_id = params["user"];
    local room_name = params["room"];
    local group = params["group"];
    local status = params["status"];
    local call_id = params["callid"];

    local call_cancel = false
    if params["callcancel"] == "true" then
       call_cancel = true;
    end

    if not verify_token(params["token"], room_name, group, {}) then
        return { status_code = 403; };
    end

    local room = get_room(room_name, group);
    if (not room) then
        log("error", "no room found %s", room_name);
        return { status_code = 404; };
    end

    local username = poltergeist.get_username(room, user_id);
    if (not username) then
        return { status_code = 404; };
    end

    local call_details = {
        ["cancel"] = call_cancel;
        ["id"] = call_id;
    };

    local nick = poltergeist.create_nick(username);
    if (not poltergeist.occupies(room, nick)) then
       return { status_code = 404; };
    end

    poltergeist.update(room, nick, status, call_details);
    return { status_code = 200; };
end

module:depends("http");
module:provides("http", {
    default_path = "/";
    name = "jibriqueue";
    route = {
        ["GET /jibriqueue/update"] = function (event) return async_handler_wrapper(event,handle_update_jibri_queue) end;
    };
});
