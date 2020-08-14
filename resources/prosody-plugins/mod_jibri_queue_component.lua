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
local room_jid_split_subdomain = module:require "util".room_jid_split_subdomain;
local internal_room_jid_match_rewrite = module:require "util".internal_room_jid_match_rewrite;
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

local ASAPKeyServer;
local ASAPKeyPath;
local ASAPKeyId;
local ASAPIssuer;
local ASAPAudience;
local ASAPAcceptedIssuers;
local ASAPAcceptedAudiences;
local ASAPTTL;
local ASAPTTL_THRESHOLD;
local ASAPKey;
local JibriRegion;
local disableTokenVerification;
local muc_component_host;
local external_api_url;
local jwtKeyCacheSize;
local jwtKeyCache;

local function load_config()
    ASAPKeyServer = module:get_option_string("asap_key_server");

    if ASAPKeyServer then
        module:log("debug", "ASAP Public Key URL %s", ASAPKeyServer);
        token_util:set_asap_key_server(ASAPKeyServer);
    end

    ASAPKeyPath
        = module:get_option_string("asap_key_path", '/etc/prosody/certs/asap.key');

    ASAPKeyId
        = module:get_option_string("asap_key_id", 'jitsi');        

    ASAPIssuer
        = module:get_option_string("asap_issuer", 'jitsi');

    ASAPAudience
        = module:get_option_string("asap_audience", 'jibri-queue');

    ASAPAcceptedIssuers
        = module:get_option_array('asap_accepted_issuers',{'jibri-queue'});
    module:log("debug", "ASAP Accepted Issuers %s", ASAPAcceptedIssuers);
    token_util:set_asap_accepted_issuers(ASAPAcceptedIssuers);

    ASAPAcceptedAudiences 
        = module:get_option_array('asap_accepted_audiences',{'*'});
    module:log("debug", "ASAP Accepted Audiences %s", ASAPAcceptedAudiences);
    token_util:set_asap_accepted_audiences(ASAPAcceptedAudiences);

    -- do not require room to be set on tokens for jibri queue
    token_util:set_asap_require_room_claim(false);

    ASAPTTL
        = module:get_option_number("asap_ttl", 3600);
 
    ASAPTTL_THRESHOLD
        = module:get_option_number("asap_ttl_threshold", 600);

    queueServiceURL
        = module:get_option_string("jibri_queue_url");

    JibriRegion
        = module:get_option_string("jibri_region", 'default');

    -- option to enable/disable token verifications
    disableTokenVerification
        = module:get_option_boolean("disable_jibri_queue_token_verification", false);

    muc_component_host 
        = module:get_option_string("muc_component");

    external_api_url = module:get_option_string("external_api_url",tostring(parentHostName));
    module:log("debug", "External advertised API URL", external_api_url);


    -- TODO: Figure out a less arbitrary default cache size.
    jwtKeyCacheSize 
        = module:get_option_number("jwt_pubkey_cache_size", 128);
    jwtKeyCache = require"util.cache".new(jwtKeyCacheSize);

    if queueServiceURL == nil then
        log("error", "No jibri_queue_url specified. No service to contact!");
        return;
    end

    if muc_component_host == nil then
        log("error", "No muc_component specified. No muc to operate on for jibri queue!");
        return;
    end

    -- Read ASAP key once on module startup
    local f = io.open(ASAPKeyPath, "r");
    if f then
        ASAPKey = f:read("*all");
        f:close();
        if not ASAPKey then
            module:log("warn", "No ASAP Key read from %s, disabling jibri queue component plugin", ASAPKeyPath);
            return
        end
    else
        module:log("warn", "Error reading ASAP Key %s, disabling jibri queue component plugin", ASAPKeyPath);
        return
    end

    return true;
end

local function reload_config()
    module:log("info", "Reloading configuration for jibri queue component");
    local config_success = load_config();

    -- clear ASAP public key cache on config reload
    token_util:clear_asap_cache();

    if not config_success then
        log("error", "Unsuccessful reconfiguration, jibri queue component may misbehave");
    end
end

local config_success = load_config();

if not config_success then
    log("error", "Unsuccessful configuration step, jibri queue component disabled")
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


log("info", "Starting jibri queue handling for %s", muc_component_host);

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

local function sendIq(participant,action,requestId,time,position,token)
    local iqId = uuid_gen();
    local from = module:get_host();
    local outStanza = st.iq({type = 'set', from = from, to = participant, id = iqId}):tag("jibri-queue", 
       { xmlns = 'http://jitsi.org/protocol/jibri-queue', requestId = requestId, action = action });

    if token then
        outStanza:tag("token"):text(token):up()
    end
    if time then
        outStanza:tag("time"):text(tostring(time)):up()
    end
    if position then
        outStanza:tag("position"):text(tostring(position)):up()
    end

    module:send(outStanza);
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

local function sendEvent(type,room_address,participant,requestId,replyIq,replyError)
    local event_ts = round(socket.gettime()*1000);
    local node, host, resource, target_subdomain = room_jid_split_subdomain(room_address);
    local room_param = '';
    if target_subdomain then
        room_param = target_subdomain..'/'..node;
    else
        room_param = node;
    end

    local out_event = {
        ["conference"] = room_address,
        ["roomParam"] = room_param,
        ["eventType"] = type,
        ["participant"] = participant,
        ["externalApiUrl"] = external_api_url.."/jibriqueue/update",
        ["requestId"] = requestId,
        ["region"] = JibriRegion,
    }
    module:log("debug","Sending event %s",inspect(out_event));

    local headers = http_headers or {}
    headers['Authorization'] = generateToken()

    module:log("debug","Sending headers %s",inspect(headers));
    local requestURL = queueServiceURL.."/job/recording"
    if type=="LeaveQueue" then
        requestURL = requestURL .."/cancel"
    end
    local request = http.request(requestURL, {
        headers = headers,
        method = "POST",
        body = json.encode(out_event)
    }, function (content_, code_, response_, request_)
        if code_ == 200 or code_ == 204 then
            module:log("debug", "URL Callback: Code %s, Content %s, Request (host %s, path %s, body %s), Response: %s",
                    code_, content_, request_.host, request_.path, inspect(request_.body), inspect(response_));
            if (replyIq) then
                module:log("debug", "sending reply IQ %s",inspect(replyIq));
                module:send(replyIq);
            end
        else
            module:log("warn", "URL Callback non successful: Code %s, Content %s, Request (%s), Response: %s",
                    code_, content_, inspect(request_), inspect(response_));
            if (replyError) then
                module:log("warn", "sending reply error IQ %s",inspect(replyError));
                module:send(replyError);
            end
        end
    end);
end

function clearRoomQueueByOccupant(room, occupant)
    room.jibriQueue[occupant.jid] = nil;
end

function addRoomQueueByOccupant(room, occupant, requestId)
    room.jibriQueue[occupant.jid] = requestId;
end

-- receives iq from client currently connected to the room
function on_iq(event)
    local requestId;
    -- Check the type of the incoming stanza to avoid loops:
    if event.stanza.attr.type == "error" then
        return; -- We do not want to reply to these, so leave.
    end
    if event.stanza.attr.to == module:get_host() then
        if event.stanza.attr.type == "set" then
            local reply = st.reply(event.stanza);
            local replyError = st.error_reply(event.stanza,'cancel','internal-server-error',"Queue Server Error");

            local jibriQueue
                = event.stanza:get_child('jibri-queue', 'http://jitsi.org/protocol/jibri-queue');
            if jibriQueue then
                module:log("debug", "Received Jibri Queue Request: %s ",inspect(jibriQueue));

                local roomAddress = jibriQueue.attr.room;
                local room = get_room_from_jid(room_jid_match_rewrite(roomAddress));

                if not room then
                    module:log("warn", "No room found %s", roomAddress);
                    return false;
                end

                local from = event.stanza.attr.from;

                local occupant = room:get_occupant_by_real_jid(from);
                if not occupant then
                    module:log("warn", "No occupant %s found for %s", from, roomAddress);
                    return false;
                end

                local action = jibriQueue.attr.action;
                if action == 'join' then
                    -- join action, so send event out
                    requestId = uuid_gen();
                    module:log("debug","Received join queue request for jid %s occupant %s requestId %s",roomAddress,occupant.jid,requestId);

                    -- now handle new jibri queue message
                    addRoomQueueByOccupant(room, occupant, requestId);
                    reply:add_child(st.stanza("jibri-queue", { xmlns = 'http://jitsi.org/protocol/jibri-queue', requestId = requestId})):up()
                    replyError:add_child(st.stanza("jibri-queue", { xmlns = 'http://jitsi.org/protocol/jibri-queue', requestId = requestId})):up()

                    module:log("debug","Sending JoinQueue event for jid %s occupant %s reply %s",roomAddress,occupant.jid,inspect(reply));
                    sendEvent('JoinQueue',roomAddress,occupant.jid,requestId,reply,replyError);
                end
                if action == 'leave' then
                    requestId = jibriQueue.attr.requestId;
                    module:log("debug","Received leave queue request for jid %s occupant %s requestId %s",roomAddress,occupant.jid,requestId);

                    -- TODO: check that requestId is the same as cached value
                    clearRoomQueueByOccupant(room, occupant);
                    reply:add_child(st.stanza("jibri-queue", { xmlns = 'http://jitsi.org/protocol/jibri-queue', requestId = requestId})):up()
                    replyError:add_child(st.stanza("jibri-queue", { xmlns = 'http://jitsi.org/protocol/jibri-queue', requestId = requestId})):up()

                    module:log("debug","Sending LeaveQueue event for jid %s occupant %s reply %s",roomAddress,occupant.jid,inspect(reply));
                    sendEvent('LeaveQueue',roomAddress,occupant.jid,requestId,reply,replyError);
                end
            else
                module:log("warn","Jibri Queue Stanza missing child %s",inspect(event.stanza))
            end
        end
    end
    return true
end

-- create recorder queue cache for the room
function room_created(event)
    local room = event.room;

    if is_healthcheck_room(room.jid) then
        return;
    end

    room.jibriQueue = {};
end

-- Conference ended, clear all queue cache jids
function room_destroyed(event)
    local room = event.room;

    if is_healthcheck_room(room.jid) then
        return;
    end
    for jid, x in pairs(room.jibriQueue) do
        if x then
            sendEvent('LeaveQueue',internal_room_jid_match_rewrite(room.jid),jid,x);
        end
    end
end

-- Occupant left remove it from the queue if it joined the queue
function occupant_leaving(event)
    local room = event.room;

    if is_healthcheck_room(room.jid) then
        return;
    end

    local occupant = event.occupant;
    local requestId = room.jibriQueue[occupant.jid];
    -- check if user has cached queue request
    if requestId then
        -- remove occupant from queue cache, signal backend
        room.jibriQueue[occupant.jid] = nil;
        sendEvent('LeaveQueue',internal_room_jid_match_rewrite(room.jid),occupant.jid,requestId);
    end
end

module:hook("iq/host", on_iq);

-- executed on every host added internally in prosody, including components
function process_host(host)
    if host == muc_component_host then -- the conference muc component
        module:log("debug","Hook to muc events on %s", host);

        local muc_module = module:context(host);
        muc_module:hook("muc-room-created", room_created, -1);
        -- muc_module:hook("muc-occupant-joined", occupant_joined, -1);
        muc_module:hook("muc-occupant-pre-leave", occupant_leaving, -1);
        muc_module:hook("muc-room-destroyed", room_destroyed, -1);
    end
end

if prosody.hosts[muc_component_host] == nil then
    module:log("debug","No muc component found, will listen for it: %s", muc_component_host)

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
function verify_token(token, room_jid, session)
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
    local verified, reason, message = token_util:process_and_verify_token(session);
    if not verified then
        log("warn", "not a valid token %s: %s", tostring(reason), tostring(message));
        log("debug", "invalid token %s", token);
        return false;
    end

    return true;
end

--- Handles request for updating jibri queue status
-- @param event the http event, holds the request query
-- @return GET response, containing a json with response details
function handle_update_jibri_queue(event)
    local body = json.decode(event.request.body);

    module:log("debug","Update Jibri Queue Event Received: %s",inspect(body));

    local token = event.request.headers["authorization"];
    if not token then
        token = ''
    else
        local prefixStart, prefixEnd = token:find("Bearer ");
        if prefixStart ~= 1 then
            module:log("error", "REST event: Invalid authorization header format. The header must start with the string 'Bearer '");
            return { status_code = 403; };
        end
        token = token:sub(prefixEnd + 1);
    end

    local user_jid = body["participant"];
    local roomAddress = body["conference"];
    local userJWT = body["token"];
    local action = body["action"];
    local time = body["time"];
    local position = body["position"];
    local requestId = body["requestId"];

    if not action then
        if userJWT then
            action = 'token';
        else
            action = 'info';
        end
    end

    local room_jid = room_jid_match_rewrite(roomAddress);

    if not verify_token(token, room_jid, {}) then
        log("error", "REST event: Invalid token for room %s to route action %s for requestId %s", roomAddress, action, requestId);
        return { status_code = 403; };
    end

    local room = get_room_from_jid(room_jid);
    if (not room) then
        log("error", "REST event: no room found %s to route action %s for requestId %s", roomAddress, action, requestId);
        return { status_code = 404; };
    end

    local occupant = room:get_occupant_by_real_jid(user_jid);
    if not occupant then
        log("warn", "REST event: No occupant %s found for %s to route action %s for requestId %s", user_jid, roomAddress, action, requestId);
        return { status_code = 404; };
    end

    if not room.jibriQueue[occupant.jid] then
        log("warn", "REST event: No queue request found for occupant %s in conference %s to route action %s for requestId %s",occupant.jid,room.jid, action, requestId)
        return { status_code = 404; };
    end

    if not requestId then
        requestId = room.jibriQueue[occupant.jid];
    end

    if action == 'token' and userJWT then
        log("debug", "REST event: Token received for occupant %s in conference %s requestId %s, clearing room queue");
        clearRoomQueueByOccupant(room, occupant);
    end

    log("debug", "REST event: Sending update for occupant %s in conference %s to route action %s for requestId %s",occupant.jid,room.jid, action, requestId);
    sendIq(occupant.jid,action,requestId,time,position,userJWT);
    return { status_code = 200; };
end

module:depends("http");
module:provides("http", {
    default_path = "/";
    name = "jibriqueue";
    route = {
        ["POST /jibriqueue/update"] = function (event) return async_handler_wrapper(event,handle_update_jibri_queue) end;
    };
});

module:hook_global('config-reloaded', reload_config);