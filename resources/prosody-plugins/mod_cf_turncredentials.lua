-- Cloudflare TURN credentials implementation for Jitsi Meet
-- Copyright (C) 2024-present 8x8, Inc.

local json = require "cjson.safe";
local http = require "net.http";
local os_time = os.time;

-- Configuration options
local cf_turn_app_id = module:get_option_string("cf_turn_app_id");
local cf_turn_app_secret = module:get_option_string("cf_turn_app_secret");
local cf_turn_api_url = module:get_option_string("cf_turn_api_url", "https://rtc.live.cloudflare.com/v1/turn/keys");
local cf_turn_ttl = module:get_option_number("cf_turn_ttl", 86400); -- 24 hours default

-- Only set headers if we have the required config
local cf_turn_headers = cf_turn_app_secret and {
    ["Content-Type"] = "application/json",
    ["Authorization"] = "Bearer " .. cf_turn_app_secret
} or nil;

-- Cache for Cloudflare TURN credentials
local credentials_cache = {};

-- Helper function to make HTTP requests to Cloudflare API
local function cf_api_request(path, method, callback)
    local url = cf_turn_api_url .. path;
    
    http.request(url, {
        method = method or "POST",
        headers = cf_turn_headers,
        body = json.encode({ttl = cf_turn_ttl})
    }, function(response_body, code, response_headers)
        if code == 200 then
            local data = json.decode(response_body);
            if data and data.success then
                callback(data.result);
            else
                module:log("error", "Failed to parse Cloudflare API response: %s", response_body);
                callback(nil);
            end
        else
            module:log("error", "Cloudflare API request failed with code %d: %s", code, response_body);
            callback(nil);
        end
    end);
end

-- Function to get fresh TURN credentials from Cloudflare
local function get_cf_turn_credentials(callback)
    if not (cf_turn_app_id and cf_turn_headers) then
        callback(nil);
        return;
    end

    -- Check cache first
    local now = os_time();
    if credentials_cache.expiry and credentials_cache.expiry > now and credentials_cache.data then
        callback(credentials_cache.data);
        return;
    end

    -- Request new credentials
    cf_api_request("/" .. cf_turn_app_id .. "/turn/credentials/generate-ice-servers", "POST", function(result)
        if result then
            -- Convert Cloudflare format to external_services format
            local services = {};
            
            -- Process each ICE server in the response
            for _, ice_server in ipairs(result.iceServers or {}) do
                -- Extract common credential info if present
                local username = ice_server.username;
                local credential = ice_server.credential;
                
                -- Process each URL
                for _, url in ipairs(ice_server.urls or {}) do
                    -- Parse the URL to extract protocol, host, port, and transport
                    local protocol, host, port, transport = url:match("^(stun[s]?|turn[s]?):([^:]+):(%d+)%??(.*)$");
                    if protocol and host then
                        -- Extract transport from query string if present
                        transport = transport:match("transport=([^&]+)") or "udp";
                        port = tonumber(port);
                        
                        local service = {
                            type = protocol:match("^(stun|turn)"),
                            host = host,
                            port = port,
                            transport = transport
                        };
                        
                        -- Add credentials for TURN servers
                        if service.type == "turn" and username and credential then
                            service.username = username;
                            service.secret = credential;
                            service.ttl = cf_turn_ttl;
                        end
                        
                        table.insert(services, service);
                    end
                end
            end

            credentials_cache = {
                data = services,
                expiry = now + cf_turn_ttl
            };
            callback(services);
        else
            callback(nil);
        end
    end);
end

-- Hook into external_services to provide Cloudflare TURN servers
module:hook("get-external-services", function(event)
    if not (cf_turn_app_id and cf_turn_headers) then
        return nil;
    end

    -- We need to return a function that will be called by external_services
    return function(callback)
        get_cf_turn_credentials(callback);
    end
end);

-- Handle config reloads
module:hook_global("config-reloaded", function()
    cf_turn_app_id = module:get_option_string("cf_turn_app_id");
    cf_turn_app_secret = module:get_option_string("cf_turn_app_secret");
    cf_turn_api_url = module:get_option_string("cf_turn_api_url", "https://rtc.live.cloudflare.com/v1/turn/keys");
    cf_turn_ttl = module:get_option_number("cf_turn_ttl", 86400);
    
    -- Update headers only if we have the required config
    cf_turn_headers = cf_turn_app_secret and {
        ["Content-Type"] = "application/json",
        ["Authorization"] = "Bearer " .. cf_turn_app_secret
    } or nil;
    
    -- Clear cache on config reload
    credentials_cache = {};
end); 