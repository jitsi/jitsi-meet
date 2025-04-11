local http_server = require "net.http.server";
local jid = require "util.jid";
local st = require 'util.stanza';
local timer = require "util.timer";
local http = require "net.http";
local cache = require "util.cache";
local array = require "util.array";
local is_set = require 'util.set'.is_set;
local usermanager = require 'core.usermanager';

local config_global_admin_jids = module:context('*'):get_option_set('admins', {}) / jid.prep;
local config_admin_jids = module:get_option_inherited_set('admins', {}) / jid.prep;

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

local OUTBOUND_SIP_JIBRI_PREFIXES = { 'outbound-sip-jibri@', 'sipjibriouta@', 'sipjibrioutb@' };
local INBOUND_SIP_JIBRI_PREFIXES = { 'inbound-sip-jibri@', 'sipjibriina@', 'sipjibriina@' };
local RECORDER_PREFIXES = module:get_option_inherited_set('recorder_prefixes', { 'recorder@recorder.', 'jibria@recorder.', 'jibrib@recorder.' });
local TRANSCRIBER_PREFIXES = module:get_option_inherited_set('transcriber_prefixes', { 'transcriber@recorder.', 'transcribera@recorder.', 'transcriberb@recorder.' });

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
        if muc then
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
function update_presence_identity(stanza, user, group, creator_user, creator_group)

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
    );

    if not user then
        return;
    end

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
-- If features are missing but we have granted_features check that
-- if features are missing from the token we check whether it is moderator
function is_feature_allowed(ft, features, granted_features, is_moderator)
    if features then
        return features[ft] == "true" or features[ft] == true;
    elseif granted_features then
        return granted_features[ft] == "true" or granted_features[ft] == true;
    else
        return is_moderator;
    end
end

--- Extracts the subdomain and room name from internal jid node [foo]room1
-- @return subdomain(optional, if extracted or nil), the room name, the customer_id in case of vpaas
function extract_subdomain(room_node)
    local ret = extract_subdomain_cache:get(room_node);
    if ret then
        return ret.subdomain, ret.room, ret.customer_id;
    end

    local subdomain, room_name = room_node:match("^%[([^%]]+)%](.+)$");

    if not subdomain then
        room_name = room_node;
    end

    local _, customer_id = subdomain and subdomain:match("^(vpaas%-magic%-cookie%-)(.*)$") or nil, nil;
    local cache_value = { subdomain=subdomain, room=room_name, customer_id=customer_id };
    extract_subdomain_cache:set(room_node, cache_value);
    return subdomain, room_name, customer_id;
end

function starts_with(str, start)
    if not str then
        return false;
    end
    return str:sub(1, #start) == start
end

function starts_with_one_of(str, prefixes)
    if not str or not prefixes then
        return false;
    end

    if is_set(prefixes) then
        -- set is a table with keys and value of true
        for k, _ in prefixes:items() do
            if starts_with(str, k) then
                return k;
            end
        end
    else
        for _, v in pairs(prefixes) do
          if starts_with(str, v) then
              return v;
          end
        end
    end

    return false
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
                -- module:log("debug", "External call was successful, content %s", content_);
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

-- check if the room tenant starts with vpaas-magic-cookie-
-- @param room the room to check
function is_vpaas(room)
    if not room then
        return false;
    end

    -- stored check in room object if it exist
    if room.is_vpaas ~= nil then
        return room.is_vpaas;
    end

    room.is_vpaas = false;

    local node, host = jid.split(room.jid);
    if host ~= muc_domain or not node then
        return false;
    end
    local tenant, conference_name = node:match('^%[([^%]]+)%](.+)$');
    if not (tenant and conference_name) then
        return false;
    end

    if not starts_with(tenant, 'vpaas-magic-cookie-') then
        return false;
    end

    room.is_vpaas = true;
    return true;
end

-- Returns the initiator extension if the stanza is coming from a sip jigasi
function is_sip_jigasi(stanza)
    if not stanza then
        return false;
    end

    return stanza:get_child('initiator', 'http://jitsi.org/protocol/jigasi');
end

-- This requires presence stanza being passed
function is_transcriber_jigasi(stanza)
    if not stanza then
        return false;
    end

    local features = stanza:get_child('features');
    if not features then
        return false;
    end

    for i = 1, #features do
        local feature = features[i];
        if feature.attr and feature.attr.var and feature.attr.var == 'http://jitsi.org/protocol/transcriber' then
            return true;
        end
    end

    return false;
end

function is_transcriber(jid)
    return starts_with_one_of(jid, TRANSCRIBER_PREFIXES);
end

function get_sip_jibri_email_prefix(email)
    if not email then
        return nil;
    elseif starts_with_one_of(email, INBOUND_SIP_JIBRI_PREFIXES) then
        return starts_with_one_of(email, INBOUND_SIP_JIBRI_PREFIXES);
    elseif starts_with_one_of(email, OUTBOUND_SIP_JIBRI_PREFIXES) then
        return starts_with_one_of(email, OUTBOUND_SIP_JIBRI_PREFIXES);
    else
        return nil;
    end
end

function is_sip_jibri_join(stanza)
    if not stanza then
        return false;
    end

    local features = stanza:get_child('features');
    local email = stanza:get_child_text('email');

    if not features or not email then
        return false;
    end

    for i = 1, #features do
        local feature = features[i];
        if feature.attr and feature.attr.var and feature.attr.var == "http://jitsi.org/protocol/jibri" then
            if get_sip_jibri_email_prefix(email) then
                module:log("debug", "Occupant with email %s is a sip jibri ", email);
                return true;
            end
        end
    end

    return false
end

function is_jibri(occupant)
    return starts_with_one_of(type(occupant) == "string" and occupant or occupant.jid, RECORDER_PREFIXES)
end

-- process a host module directly if loaded or hooks to wait for its load
function process_host_module(name, callback)
    local function process_host(host)

        if host == name then
            callback(module:context(host), host);
        end
    end

    if prosody.hosts[name] == nil then
        module:log('info', 'No host/component found, will wait for it: %s', name)

        -- when a host or component is added
        prosody.events.add_handler('host-activated', process_host);
    else
        process_host(name);
    end
end

function table_shallow_copy(t)
    local t2 = {}
    for k, v in pairs(t) do
        t2[k] = v
    end
    return t2
end

local function table_find(tab, val)
    if not tab then
        return nil
    end

    for i, v in ipairs(tab) do
        if v == val then
            return i
        end
    end
    return nil
end

-- Splits a string using delimiter
function split_string(str, delimiter)
    str = str .. delimiter;
    local result = array();
    for w in str:gmatch("(.-)" .. delimiter) do
        result:push(w);
    end

    return result;
end

-- send iq result that the iq was received and will be processed
function respond_iq_result(origin, stanza)
    -- respond with successful receiving the iq
    origin.send(st.iq({
        type = 'result';
        from = stanza.attr.to;
        to = stanza.attr.from;
        id = stanza.attr.id
    }));
end

-- Note: http_server.get_request_from_conn() was added in Prosody 0.12.3,
-- this code provides backwards compatibility with older versions
local get_request_from_conn = http_server.get_request_from_conn or function (conn)
    local response = conn and conn._http_open_response;
    return response and response.request or nil;
end;

-- Discover real remote IP of a session
function get_ip(session)
    local request = get_request_from_conn(session.conn);
    return request and request.ip or session.ip;
end

-- Checks whether the provided jid is in the list of admins
-- we are not using the new permissions and roles api as we have few global modules which need to be
-- refactored into host modules, as that api needs to be executed in host context
local function is_admin(_jid)
    local bare_jid = jid.bare(_jid);

    if config_global_admin_jids:contains(bare_jid) or config_admin_jids:contains(bare_jid) then
        return true;
    end
    return false;
end

return {
    OUTBOUND_SIP_JIBRI_PREFIXES = OUTBOUND_SIP_JIBRI_PREFIXES;
    INBOUND_SIP_JIBRI_PREFIXES = INBOUND_SIP_JIBRI_PREFIXES;
    RECORDER_PREFIXES = RECORDER_PREFIXES;
    extract_subdomain = extract_subdomain;
    is_admin = is_admin;
    is_feature_allowed = is_feature_allowed;
    is_jibri = is_jibri;
    is_healthcheck_room = is_healthcheck_room;
    is_moderated = is_moderated;
    is_sip_jibri_join = is_sip_jibri_join;
    is_sip_jigasi = is_sip_jigasi;
    is_transcriber = is_transcriber;
    is_transcriber_jigasi = is_transcriber_jigasi;
    is_vpaas = is_vpaas;
    get_focus_occupant = get_focus_occupant;
    get_ip = get_ip;
    get_room_from_jid = get_room_from_jid;
    get_room_by_name_and_subdomain = get_room_by_name_and_subdomain;
    get_sip_jibri_email_prefix = get_sip_jibri_email_prefix;
    async_handler_wrapper = async_handler_wrapper;
    presence_check_status = presence_check_status;
    process_host_module = process_host_module;
    respond_iq_result = respond_iq_result;
    room_jid_match_rewrite = room_jid_match_rewrite;
    room_jid_split_subdomain = room_jid_split_subdomain;
    internal_room_jid_match_rewrite = internal_room_jid_match_rewrite;
    update_presence_identity = update_presence_identity;
    http_get_with_retry = http_get_with_retry;
    ends_with = ends_with;
    split_string = split_string;
    starts_with = starts_with;
    starts_with_one_of = starts_with_one_of;
    table_shallow_copy = table_shallow_copy;
    table_find = table_find;
};
