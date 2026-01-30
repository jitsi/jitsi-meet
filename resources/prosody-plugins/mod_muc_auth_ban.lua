-- Can be used to ban users based on external http service
-- Copyright (C) 2023-present 8x8, Inc.

local ACCESS_MANAGER_URL = module:get_option_string("muc_prosody_jitsi_access_manager_url");
if not ACCESS_MANAGER_URL then
    module:log("warn", "No 'muc_prosody_jitsi_access_manager_url' option set, disabling module");
    return
end

local json = require "cjson.safe";
local http = require "net.http";
local inspect = require 'inspect';

local util = module:require 'util';
local get_room_by_name_and_subdomain = util.get_room_by_name_and_subdomain;
local is_vpaas = util.is_vpaas;

local ban_check_count = module:measure("muc_auth_ban_check", "rate")
local ban_check_users_banned_count = module:measure("muc_auth_ban_users_banned", "rate")
local ban_check_error_count = module:measure("muc_auth_ban_check_error", "rate")

-- we will cache banned tokens to avoid extra requests
-- on destroying session, websocket retries 2 more times before giving up
local cache = require "util.cache".new(100);

local CACHE_DURATION = 5*60; -- 5 mins

local cache_timer = module:add_timer(CACHE_DURATION, function()
    for k, v in cache:items() do
        if socket.gettime() > v + CACHE_DURATION then
            cache:set(k, nil);
        end
    end

    if cache:count() > 0 then
        -- rescheduling the timer
        return CACHE_DURATION;
    end

    -- skipping return value stops the timer
end);

local function shouldAllow(session)
    local token = session.auth_token;

    if token ~= nil and session.jitsi_web_query_room and session.jitsi_web_query_prefix then
        -- cached tokens are banned
        if cache:get(token) then
            return false;
        end

        local room = get_room_by_name_and_subdomain(session.jitsi_web_query_room, session.jitsi_web_query_prefix);
        if not room then
            return nil;
        end
        if not is_vpaas(room) then
            return true;
        end

        -- TODO: do this only for enabled customers
        ban_check_count();
        local function cb(content, code, response, request)
            if code == 200 then

                local r = json.decode(content)
                if r['access'] ~= nil and r['access'] == false then
                    module:log("info", "User is banned room:%s tenant:%s user_id:%s group:%s",
                        session.jitsi_web_query_room, session.jitsi_web_query_prefix,
                        inspect(session.jitsi_meet_context_user), session.jitsi_meet_context_group);

                    ban_check_users_banned_count();

                    session:close();

                    -- if the cache is empty and the timer is not running reschedule it
                    if cache:count() == 0 then
                        cache_timer:reschedule(CACHE_DURATION);
                    end

                    cache:set(token, socket.gettime());
                end
            else
                ban_check_error_count();
                module:log("warn", "Error code:%s contacting url:%s content:%s room:%s tenant:%s response:%s request:%s",
                    code, ACCESS_MANAGER_URL, session.jitsi_web_query_room, session.jitsi_web_query_prefix,
                    inspect(response), inspect(request), content);
            end
        end

        local request_headers = {}
        request_headers['Authorization'] = 'Bearer ' .. token;

        http.request(ACCESS_MANAGER_URL, {
            headers = request_headers,
            method = "GET",
        }, cb);

        return true;
    end
end

prosody.events.add_handler("jitsi-access-ban-check", function(session)
    return shouldAllow(session)
end)
