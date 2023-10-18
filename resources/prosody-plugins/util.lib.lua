local jid = require "util.jid";
local timer = require "util.timer";
local http = require "net.http";
local cache = require "util.cache";

local http_timeout = 30;
local have_async, async = pcall(require, "util.async");
local http_headers = {
    ["User-Agent"] = "Prosody ("..prosody.version.."; "..prosody.platform..")"
};

local muc_domain_prefix = module:get_option_string("muc_mapper_domain_prefix", "conference");

-- defaults to module.host, the module that uses the utility
local muc_domain_base = module:get_option_string("muc_mapper_domain_base", module.host);

-- The "real" MUC domain that we are proxying to
local muc_domain = module:get_option_string("muc_mapper_domain", muc_domain_prefix.."."..muc_domain_base);

local escaped_muc_domain_base = muc_domain_base:gsub("%p", "%%%1");
local escaped_muc_domain_prefix = muc_domain_prefix:gsub("%p", "%%%1");
-- The pattern used to extract the target subdomain
-- (e.g. extract 'foo' from 'conference.foo.example.com')
local target_subdomain_pattern = "^"..escaped_muc_domain_prefix..".([^%.]+)%."..escaped_muc_domain_base;

-- table to store all incoming iqs without roomname in it, like discoinfo to the muc component
local roomless_iqs = {};

local split_subdomain_cache = cache.new(1000);
local extract_subdomain_cache = cache.new(1000);
local internal_room_jid_cache = cache.new(1000);

local moderated_subdomains = module:get_option_set("allowners_moderated_subdomains", {})
local moderated_rooms = module:get_option_set("allowners_moderated_rooms", {})

-- Utility function to split room JID to include room name and subdomain
-- (e.g. from room1@conference.foo.example.com/res returns (room1, example.com, res, foo))
local function room_jid_split_subdomain(room_jid)
    local ret = split_subdomain_cache:get(room_jid);
    if ret then
        return ret.node, ret.host, ret.resource, ret.subdomain;
    end

    local node, host, resource = jid.split(room_jid);

    local target_subdomain = host and host:match(target_subdomain_pattern);
    local cache_value = {node=node, host=host, resource=resource, subdomain=target_subdomain};
    split_subdomain_cache:set(room_jid, cache_value);
    return node, host, resource, target_subdomain;
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

    return jid.join(new_node, new_host, new_resource);
end

-- Utility function to check and convert a room JID from real [foo]room1@muc.example.com to virtual room1@muc.foo.example.com
local function internal_room_jid_match_rewrite(room_jid, stanza)
    -- first check for roomless_iqs
    if (stanza and stanza.attr and stanza.attr.id and roomless_iqs[stanza.attr.id]) then
        local result = roomless_iqs[stanza.attr.id];
        roomless_iqs[stanza.attr.id] = nil;
        return result;
    end

    local ret = internal_room_jid_cache:get(room_jid);
    if ret then
        return ret;
    end

    local node, host, resource = jid.split(room_jid);
    if host ~= muc_domain or not node then
        -- module:log("debug", "No need to rewrite %s (not from the MUC host)", room_jid);
        internal_room_jid_cache:set(room_jid, room_jid);
        return room_jid;
    end

    local target_subdomain, target_node = extract_subdomain(node);
    if not (target_node and target_subdomain) then
        -- module:log("debug", "Not rewriting... unexpected node format: %s", node);
        internal_room_jid_cache:set(room_jid, room_jid);
        return room_jid;
    end

    -- Ok, rewrite room_jid address to pretty format
    ret = jid.join(target_node, muc_domain_prefix..".".. target_subdomain.."."..muc_domain_base, resource);
    internal_room_jid_cache:set(room_jid, ret);
    return ret;
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

-- Returns the room if available, work and in multidomain mode
-- @param room_name the name of the room
-- @param group name of the group (optional)
-- @return returns room if found or nil
function get_room_by_name_and_subdomain(room_name, subdomain)
    local room_address;

    -- if there is a subdomain we are in multidomain mode and that subdomain is not our main host
    if subdomain and subdomain ~= "" and subdomain ~= muc_domain_base then
        room_address = jid.join("["..subdomain.."]"..room_name, muc_domain);
    else
        room_address = jid.join(room_name, muc_domain);
    end

    return get_room_from_jid(room_address);
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
    end

    stanza:up(); -- Close identity tag
end

-- Utility function to check whether feature is present and enabled. Allow
-- a feature if there are features present in the session(coming from
-- the token) and the value of the feature is true.
-- If features is not present in the token we skip feature detection and allow
-- everything.
function is_feature_allowed(features, ft)
    if (features == nil or features[ft] == "true" or features[ft] == true) then
        return true;
    else
        return false;
    end
end

--- Extracts the subdomain and room name from internal jid node [foo]room1
-- @return subdomain(optional, if extracted or nil), the room name
function extract_subdomain(room_node)
    local ret = extract_subdomain_cache:get(room_node);
    if ret then
        return ret.subdomain, ret.room;
    end

    local subdomain, room_name = room_node:match("^%[([^%]]+)%](.+)$");
    local cache_value = {subdomain=subdomain, room=room_name};
    extract_subdomain_cache:set(room_node, cache_value);
    return subdomain, room_name;
end

function starts_with(str, start)
    return str:sub(1, #start) == start
end

function ends_with(str, ending)
    return ending == "" or str:sub(-#ending) == ending
end

-- healthcheck rooms in jicofo starts with a string '__jicofo-health-check'
function is_healthcheck_room(room_jid)
    return starts_with(room_jid, "__jicofo-health-check");
end

--- Utility function to make an http get request and
--- retry @param retry number of times
-- @param url endpoint to be called
-- @param retry nr of retries, if retry is
-- @param auth_token value to be passed as auth Bearer
-- nil there will be no retries
-- @returns result of the http call or nil if
-- the external call failed after the last retry
function http_get_with_retry(url, retry, auth_token)
    local content, code, cache_for;
    local timeout_occurred;
    local wait, done = async.waiter();
    local request_headers = http_headers or {}
    if auth_token ~= nil then
        request_headers['Authorization'] = 'Bearer ' .. auth_token
    end

    local function cb(content_, code_, response_, request_)
        if timeout_occurred == nil then
            code = code_;
            if code == 200 or code == 204 then
                module:log("debug", "External call was successful, content %s", content_);
                content = content_;

                -- if there is cache-control header, let's return the max-age value
                if response_ and response_.headers and response_.headers['cache-control'] then
                    local vals = {};
                    for k, v in response_.headers['cache-control']:gmatch('(%w+)=(%w+)') do
                      vals[k] = v;
                    end
                    -- max-age=123 will be parsed by the regex ^ to age=123
                    cache_for = vals.age;
                end
            else
                module:log("warn", "Error on GET request: Code %s, Content %s",
                    code_, content_);
            end
            done();
        else
            module:log("warn", "External call reply delivered after timeout from: %s", url);
        end
    end

    local function call_http()
        return http.request(url, {
            headers = request_headers,
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

    return content, code, cache_for;
end

-- Checks whether there is status in the <x node
-- @param muc_x the <x element from presence
-- @param status checks for this status
-- @returns true if the status is found, false otherwise or if no muc_x is provided.
function presence_check_status(muc_x, status)
    if not muc_x then
        return false;
    end

    for statusNode in muc_x:childtags('status') do
        if statusNode.attr.code == status then
            return true;
        end
    end

    return false;
end

-- Retrieves the focus from the room and cache it in the room object
-- @param room The room name for which to find the occupant
local function get_focus_occupant(room)
    return room:get_occupant_by_nick(room.jid..'/focus');
end

-- Checks whether the jid is moderated, the room name is in moderated_rooms
-- or if the subdomain is in the moderated_subdomains
-- @return returns on of the:
--      -> false
--      -> true, room_name, subdomain
--      -> true, room_name, nil (if no subdomain is used for the room)
function is_moderated(room_jid)
    if moderated_subdomains:empty() and moderated_rooms:empty() then
        return false;
    end

    local room_node = jid.node(room_jid);
    -- parses bare room address, for multidomain expected format is:
    -- [subdomain]roomName@conference.domain
    local target_subdomain, target_room_name = extract_subdomain(room_node);
    if target_subdomain then
        if moderated_subdomains:contains(target_subdomain) then
            return true, target_room_name, target_subdomain;
        end
    elseif moderated_rooms:contains(room_node) then
        return true, room_node, nil;
    end

    return false;
end

return {
    extract_subdomain = extract_subdomain;
    is_feature_allowed = is_feature_allowed;
    is_healthcheck_room = is_healthcheck_room;
    is_moderated = is_moderated;
    get_focus_occupant = get_focus_occupant;
    get_room_from_jid = get_room_from_jid;
    get_room_by_name_and_subdomain = get_room_by_name_and_subdomain;
    async_handler_wrapper = async_handler_wrapper;
    presence_check_status = presence_check_status;
    room_jid_match_rewrite = room_jid_match_rewrite;
    room_jid_split_subdomain = room_jid_split_subdomain;
    internal_room_jid_match_rewrite = internal_room_jid_match_rewrite;
    update_presence_identity = update_presence_identity;
    http_get_with_retry = http_get_with_retry;
    ends_with = ends_with;
    starts_with = starts_with;
};
