local jid = require "util.jid";
local timer = require "util.timer";
local http = require "net.http";

local http_timeout = 30;
local have_async, async = pcall(require, "util.async");
local http_headers = {
    ["User-Agent"] = "Prosody ("..prosody.version.."; "..prosody.platform..")"
};

local muc_domain_prefix
    = module:get_option_string("muc_mapper_domain_prefix", "conference");

-- defaults to module.host, the module that uses the utility
local muc_domain_base
    = module:get_option_string("muc_mapper_domain_base", module.host);

-- The "real" MUC domain that we are proxying to
local muc_domain = module:get_option_string(
    "muc_mapper_domain", muc_domain_prefix.."."..muc_domain_base);

local escaped_muc_domain_base = muc_domain_base:gsub("%p", "%%%1");
local escaped_muc_domain_prefix = muc_domain_prefix:gsub("%p", "%%%1");
-- The pattern used to extract the target subdomain
-- (e.g. extract 'foo' from 'conference.foo.example.com')
local target_subdomain_pattern
    = "^"..escaped_muc_domain_prefix..".([^%.]+)%."..escaped_muc_domain_base;

-- table to store all incoming iqs without roomname in it, like discoinfo to the muc compoent
local roomless_iqs = {};

-- Utility function to split room JID to include room name and subdomain
-- (e.g. from room1@conference.foo.example.com/res returns (room1, example.com, res, foo))
local function room_jid_split_subdomain(room_jid)
    local node, host, resource = jid.split(room_jid);

    -- optimization, skip matching if there is no subdomain or it is not the muc component address at all
    if host == muc_domain or not starts_with(host, muc_domain_prefix) then
        return node, host, resource;
    end

    local target_subdomain = host and host:match(target_subdomain_pattern);
    return node, host, resource, target_subdomain
end

--- Utility function to check and convert a room JID from
--- virtual room1@conference.foo.example.com to real [foo]room1@conference.example.com
-- @param room_jid the room jid to match and rewrite if needed
-- @param stanza the stanza
-- @return returns room jid [foo]room1@conference.example.com when it has subdomain
-- otherwise room1@conference.example.com(the room_jid value untouched)
local function room_jid_match_rewrite(room_jid, stanza)
    local node, _, resource, target_subdomain = room_jid_split_subdomain(room_jid);
    if not target_subdomain then
        -- module:log("debug", "No need to rewrite out 'to' %s", room_jid);
        return room_jid;
    end
    -- Ok, rewrite room_jid  address to new format
    local new_node, new_host, new_resource;
    if node then
        new_node, new_host, new_resource = "["..target_subdomain.."]"..node, muc_domain, resource;
    else
        -- module:log("debug", "No room name provided so rewriting only host 'to' %s", room_jid);
        new_host, new_resource = muc_domain, resource;

        if (stanza and stanza.attr and stanza.attr.id) then
            roomless_iqs[stanza.attr.id] = stanza.attr.to;
        end
    end
    room_jid = jid.join(new_node, new_host, new_resource);
    -- module:log("debug", "Rewrote to %s", room_jid);
    return room_jid
end

-- Utility function to check and convert a room JID from real [foo]room1@muc.example.com to virtual room1@muc.foo.example.com
local function internal_room_jid_match_rewrite(room_jid, stanza)
    local node, host, resource = jid.split(room_jid);
    if host ~= muc_domain or not node then
        -- module:log("debug", "No need to rewrite %s (not from the MUC host)", room_jid);

        if (stanza and stanza.attr and stanza.attr.id and roomless_iqs[stanza.attr.id]) then
            local result = roomless_iqs[stanza.attr.id];
            roomless_iqs[stanza.attr.id] = nil;
            return result;
        end

        return room_jid;
    end

    local target_subdomain, target_node = extract_subdomain(node);
    if not (target_node and target_subdomain) then
        -- module:log("debug", "Not rewriting... unexpected node format: %s", node);
        return room_jid;
    end

    -- Ok, rewrite room_jid address to pretty format
    local new_node, new_host, new_resource = target_node, muc_domain_prefix..".".. target_subdomain.."."..muc_domain_base, resource;
    room_jid = jid.join(new_node, new_host, new_resource);
    -- module:log("debug", "Rewrote to %s", room_jid);
    return room_jid
end

--- Finds and returns room by its jid
-- @param room_jid the room jid to search in the muc component
-- @return returns room if found or nil
function get_room_from_jid(room_jid)
    local _, host = jid.split(room_jid);
    local component = hosts[host];
    if component then
        local muc = component.modules.muc
        if muc and rawget(muc,"rooms") then
            -- We're running 0.9.x or 0.10 (old MUC API)
            return muc.rooms[room_jid];
        elseif muc and rawget(muc,"get_room_from_jid") then
            -- We're running >0.10 (new MUC API)
            return muc.get_room_from_jid(room_jid);
        else
            return
        end
    end
end

function async_handler_wrapper(event, handler)
    if not have_async then
        module:log("error", "requires a version of Prosody with util.async");
        return nil;
    end

    local runner = async.runner;

    -- Grab a local response so that we can send the http response when
    -- the handler is done.
    local response = event.response;
    local async_func = runner(
        function (event)
            local result = handler(event)

            -- If there is a status code in the result from the
            -- wrapped handler then add it to the response.
            if tonumber(result.status_code) ~= nil then
                response.status_code = result.status_code
            end

            -- If there are headers in the result from the
            -- wrapped handler then add them to the response.
            if result.headers ~= nil then
                response.headers = result.headers
            end

            -- Send the response to the waiting http client with
            -- or without the body from the wrapped handler.
            if result.body ~= nil then
                response:send(result.body)
            else
                response:send();
            end
        end
    )
    async_func:run(event)
    -- return true to keep the client http connection open.
    return true;
end

--- Updates presence stanza, by adding identity node
-- @param stanza the presence stanza
-- @param user the user to which presence we are updating identity
-- @param group the group of the user to which presence we are updating identity
-- @param creator_user the user who created the user which presence we
-- are updating (this is the poltergeist case, where a user creates
-- a poltergeist), optional.
-- @param creator_group the group of the user who created the user which
-- presence we are updating (this is the poltergeist case, where a user creates
-- a poltergeist), optional.
function update_presence_identity(
    stanza, user, group, creator_user, creator_group)

    -- First remove any 'identity' element if it already
    -- exists, so it cannot be spoofed by a client
    stanza:maptags(
        function(tag)
            for k, v in pairs(tag) do
                if k == "name" and v == "identity" then
                    return nil
                end
            end
            return tag
        end
    )
    module:log("debug",
        "Presence after previous identity stripped: %s", tostring(stanza));

    stanza:tag("identity"):tag("user");
    for k, v in pairs(user) do
        v = tostring(v)
        stanza:tag(k):text(v):up();
    end
    stanza:up();

    -- Add the group information if it is present
    if group then
        stanza:tag("group"):text(group):up();
    end

    -- Add the creator user information if it is present
    if creator_user then
        stanza:tag("creator_user");
        for k, v in pairs(creator_user) do
            stanza:tag(k):text(v):up();
        end
        stanza:up();

        -- Add the creator group information if it is present
        if creator_group then
            stanza:tag("creator_group"):text(creator_group):up();
        end
        stanza:up();
    end

    module:log("debug",
        "Presence with identity inserted %s", tostring(stanza))
end

-- Utility function to check whether feature is present and enabled. Allow
-- a feature if there are features present in the session(coming from
-- the token) and the value of the feature is true.
-- If features is not present in the token we skip feature detection and allow
-- everything.
function is_feature_allowed(session, feature)
    if (session.jitsi_meet_context_features == nil
        or session.jitsi_meet_context_features[feature] == "true" or session.jitsi_meet_context_features[feature] == true) then
        return true;
    else
        return false;
    end
end

--- Extracts the subdomain and room name from internal jid node [foo]room1
-- @return subdomain(optional, if extracted or nil), the room name
function extract_subdomain(room_node)
    -- optimization, skip matching if there is no subdomain, no [subdomain] part in the beginning of the node
    if not starts_with(room_node, '[') then
        return nil,room_node;
    end

    return room_node:match("^%[([^%]]+)%](.+)$");
end

function starts_with(str, start)
    return str:sub(1, #start) == start
end

-- healthcheck rooms in jicofo starts with a string '__jicofo-health-check'
function is_healthcheck_room(room_jid)
    if starts_with(room_jid, "__jicofo-health-check") then
        return true;
    end

    return false;
end

--- Utility function to make an http get request and
--- retry @param retry number of times
-- @param url endpoint to be called
-- @param retry nr of retries, if retry is
-- nil there will be no retries
-- @returns result of the http call or nil if
-- the external call failed after the last retry
function http_get_with_retry(url, retry)
    local content, code;
    local timeout_occurred;
    local wait, done = async.waiter();
    local function cb(content_, code_, response_, request_)
        if timeout_occurred == nil then
            code = code_;
            if code == 200 or code == 204 then
                module:log("debug", "External call was successful, content %s", content_);
                content = content_
            else
                module:log("warn", "Error on public key request: Code %s, Content %s",
                    code_, content_);
            end
            done();
        else
            module:log("warn", "External call reply delivered after timeout from: %s", url);
        end
    end

    local function call_http()
        return http.request(url, {
            headers = http_headers or {},
            method = "GET"
        }, cb);
    end

    local request = call_http();

    local function cancel()
        -- TODO: This check is racey. Not likely to be a problem, but we should
        --       still stick a mutex on content / code at some point.
        if code == nil then
            timeout_occurred = true;
            module:log("warn", "Timeout %s seconds making the external call to: %s", http_timeout, url);
            -- no longer present in prosody 0.11, so check before calling
            if http.destroy_request ~= nil then
                http.destroy_request(request);
            end
            if retry == nil then
                module:log("debug", "External call failed and retry policy is not set");
                done();
            elseif retry ~= nil and retry < 1 then
                module:log("debug", "External call failed after retry")
                done();
            else
                module:log("debug", "External call failed, retry nr %s", retry)
                retry = retry - 1;
                request = call_http()
                return http_timeout;
            end
        end
    end
    timer.add_task(http_timeout, cancel);
    wait();

    return content;
end

return {
    extract_subdomain = extract_subdomain;
    is_feature_allowed = is_feature_allowed;
    is_healthcheck_room = is_healthcheck_room;
    get_room_from_jid = get_room_from_jid;
    async_handler_wrapper = async_handler_wrapper;
    room_jid_match_rewrite = room_jid_match_rewrite;
    room_jid_split_subdomain = room_jid_split_subdomain;
    internal_room_jid_match_rewrite = internal_room_jid_match_rewrite;
    update_presence_identity = update_presence_identity;
    http_get_with_retry = http_get_with_retry;
};
