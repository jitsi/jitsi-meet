-- Can be used to ban users based on external http service
-- Copyright (C) 2023-present 8x8, Inc.

local ACCESS_MANAGER_URL = module:get_option_string("muc_prosody_jitsi_access_manager_url");
if not ACCESS_MANAGER_URL then
    module:log("warn", "No 'muc_prosody_jitsi_access_manager_url' option set, disabling module");
    return
end

local json = require "cjson.safe";
local http = require "net.http";

local ban_check_count = module:measure("muc_auth_ban_check", "rate")
local ban_check_users_banned_count = module:measure("muc_auth_ban_users_banned", "rate")

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

    if token ~= nil then
        module:log("debug", "Checking whether user should be banned ")

        -- cached tokens are banned
        if cache:get(token) then
            return false;
        end

        -- TODO: do this only for enabled customers
        ban_check_count();
        local function cb(content, code, response, request)
            if code == 200 then

                local r = json.decode(content)
                if r['access'] ~= nil and r['access'] == false then
                    module:log("debug", "user is banned")

                    ban_check_users_banned_count();

                    session:close();

                    -- if the cache is empty and the timer is not running reschedule it
                    if cache:count() == 0 then
                        cache_timer:reschedule(CACHE_DURATION);
                    end

                    cache:set(token, socket.gettime());
                end
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
