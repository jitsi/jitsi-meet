-- Cloudflare TURN credentials implementation

local json = require "cjson.safe";
local http = require "net.http";
local os_time = os.time;

-- Configuration options are now module-level variables, populated by update_config_options()
local cf_turn_app_id
local cf_turn_app_secret
local cf_turn_api_url
local cf_turn_ttl -- Parsed as a number (seconds)
local cf_turn_headers -- HTTP headers for CF API

-- Cache for the raw Cloudflare API response (the iceServers array)
local cf_api_response_cache = { data = nil, expiry = 0 };
-- Stores references to the actual table items added to Prosody's "external_service" list by this module
local currently_added_prosody_items = {};

-- Loads/reloads configuration options from Prosody config
local function update_config_options()
    cf_turn_app_id = module:get_option_string("cf_turn_app_id");
    cf_turn_app_secret = module:get_option_string("cf_turn_app_secret");
    cf_turn_api_url = module:get_option_string("cf_turn_api_url", "https://rtc.live.cloudflare.com/v1/turn/keys");
    cf_turn_ttl = module:get_option_number("cf_turn_ttl", 86400); -- Default 24 hours, in seconds

    if cf_turn_app_id and cf_turn_app_secret then
        cf_turn_headers = {
            ["Content-Type"] = "application/json",
            ["Authorization"] = "Bearer " .. cf_turn_app_secret
        };
    else
        cf_turn_headers = nil;
    end
    module:log("debug", "CF TURN config: app_id set: %s, app_secret set: %s, ttl: %s",
        tostring(cf_turn_app_id ~= nil), tostring(cf_turn_app_secret ~= nil), tostring(cf_turn_ttl));
end

-- Fetches fresh TURN data from Cloudflare API
local function get_fresh_cf_data(callback)
    if not (cf_turn_app_id and cf_turn_headers) then
        module:log("warn", "Cloudflare App ID or Secret not configured. Cannot request TURN credentials.");
        callback(nil);
        return;
    end

    -- Construct the URL robustly. Assumes cf_turn_api_url is base like "https://host.com/path"
    -- and path_segment is like "/app_id/more/path"
    local path_segment = ("/%s/credentials/generate-ice-servers"):format(cf_turn_app_id);
    local full_url = cf_turn_api_url .. path_segment;
    -- Example: "https://rtc.live.cloudflare.com/v1/turn/keys" .. "/<app_id>/credentials/generate-ice-servers"

    module:log("debug", "Requesting Cloudflare TURN credentials from %s", full_url);

    http.request(full_url, {
        method = "POST",
        headers = cf_turn_headers,
        body = json.encode({ttl = cf_turn_ttl}) -- Cloudflare API expects TTL for the credentials
    }, function(response_body, code, response_headers)
        if code == 200 or code == 201 then
            local data, err = json.decode(response_body);
            if err then
                module:log("error", "Failed to decode JSON from Cloudflare API response: %s. Body: %s", err, response_body);
                callback(nil);
                return;
            end

            -- Assuming Cloudflare response structure is { "success": true, "result": { "iceServers": [...] } }
            -- or directly { "iceServers": [...] } if 'success' and 'result' are not present for this specific endpoint.
            -- The original module checked for data.success and data.result.iceServers.
            if data and data.success and data.result and data.result.iceServers then
                module:log("info", "Successfully fetched new credentials from Cloudflare.");
                callback(data.result.iceServers); -- Pass the array of iceServer objects
            elseif data and data.iceServers then -- Fallback for a simpler structure
                 module:log("info", "Successfully fetched new credentials from Cloudflare (simple structure).");
                 callback(data.iceServers);
            else
                module:log("error", "Failed to parse Cloudflare API response or unexpected structure: %s", response_body);
                callback(nil);
            end
        else
            module:log("error", "Cloudflare API request failed. URL: %s, Code: %d, Body: %s", full_url, code, response_body);
            callback(nil);
        end
    end);
end

-- Converts raw Cloudflare iceServer data to Prosody external_service item format
local function convert_cf_ice_servers_to_prosody_format(cf_ice_servers_array)
    local prosody_services = {};
    if not cf_ice_servers_array then return prosody_services; end

    -- Function to parse STUN/TURN URLs
    local function parse_url(url_str)
      -- First capture the protocol
      local proto, rest = url_str:match("^([^:]+):(.+)$")

      if not proto then
        return nil
      end

      -- Next parse the hostname and port
      local hostname, port_and_query = rest:match("^([^:]+):(.+)$")

      if not hostname then
        -- Check if there's no port (e.g. stun:stun.l.google.com)
        -- This case might not be strictly needed for Cloudflare but good for robustness
        hostname = rest
        port_and_query = "" -- No port and no query
        if hostname:find("?") or hostname:find(":") then -- if it still contains these, it's not a simple hostname
            return nil
        end
      end

      -- Finally parse the port and optional query parameters
      local port, query

      if port_and_query:find("?") then
        port, query = port_and_query:match("^(%d+)%?(.*)$")
      elseif port_and_query == "" then -- Case where hostname was simple and no port/query
        port = nil -- No port specified
        query = ""
      else
        port = port_and_query:match("^(%d+)$")
        query = ""
      end

      -- Convert port to number if present, or use default based on protocol
      if port then
          port = tonumber(port)
      end

      return proto, hostname, port, query
    end

    for _, ice_server in ipairs(cf_ice_servers_array) do
        local username = ice_server.username;
        local credential = ice_server.credential; -- This is the password for the TURN server

        for _, url_string in ipairs(ice_server.urls or {}) do
            local protocol_raw, host, port_num, query_str = parse_url(url_string);

            if protocol_raw and host then
                module:log("debug", "Parsed URL: proto=%s, host=%s, port=%s, query=%s",
                    tostring(protocol_raw), tostring(host), tostring(port_num), tostring(query_str));

                local transport = "udp"; -- Default transport
                if query_str and query_str ~= "" then
                    local transport_match = query_str:match("transport=([a-zA-Z0-9]+)");
                    if transport_match then
                        transport = transport_match;
                        module:log("debug", "Transport explicitly set to '%s' from URL: %s", transport, url_string);
                    end
                end

                -- Determine default port if not specified (common for STUN)
                if not port_num then
                    if protocol_raw == "stun" then
                        port_num = 3478; -- Default STUN port
                        module:log("debug", "Port not specified for STUN, defaulting to %d for URL: %s", port_num, url_string);
                    elseif protocol_raw == "turn" or protocol_raw == "turns" then
                        -- TURN usually specifies port. If not, could default or log warning.
                        -- For Cloudflare, ports are always specified.
                        module:log("warn", "Port not specified for TURN/TURNS URL, this is unusual: %s", url_string);
                        goto next_url; -- Skip if port is missing for TURN/S
                    end
                end


                local service_type;
                if protocol_raw == "stun" then service_type = "stun";
                elseif protocol_raw == "turn" or protocol_raw == "turns" then service_type = "turn"; -- Prosody uses "turn" for both
                else
                    module:log("warn", "Unknown protocol type '%s' in URL: %s", protocol_raw, url_string);
                    goto next_url; -- Skip this URL
                end

                local service_item = {
                    type = service_type,
                    host = host,
                    port = port_num, -- Use the parsed and potentially defaulted port_num
                    transport = transport,
                    ttl = cf_turn_ttl -- mod_external_services uses this 'ttl' to calculate 'expires'
                };

                if service_type == "turn" and username and credential then
                    service_item.username = username;
                    service_item.password = credential; -- Directly provide username/password
                    service_item.restricted = true;     -- Mark as restricted
                end
                table.insert(prosody_services, service_item);
            else
                module:log("warn", "Could not parse ICE server URL: %s", url_string);
            end
            ::next_url::
        end
    end
    return prosody_services;
end

-- Updates Prosody's "external_service" items with the new list of services
local function update_prosody_service_items(new_service_items_tables)
    -- Remove all items previously added by this module
    for _, old_item_table in ipairs(currently_added_prosody_items) do
        module:remove_item("external_service", old_item_table);
    end
    currently_added_prosody_items = {}; -- Clear the list of references

    -- Add new items
    if new_service_items_tables then
        for _, service_item_table in ipairs(new_service_items_tables) do
            module:add_item("external_service", service_item_table);
            table.insert(currently_added_prosody_items, service_item_table); -- Store reference for future removal
        end
    end
    module:log("info", "Updated Prosody with %d Cloudflare TURN/STUN services.", #currently_added_prosody_items);

    if #currently_added_prosody_items == 0 and cf_turn_app_id and cf_turn_app_secret then
        module:log("warn", "No TURN/STUN services were added from Cloudflare, though configuration seems present. Check API response and parsing.");
    end
end

-- Main function to fetch/refresh credentials and update Prosody
local function refresh_and_update_credentials()
    module:log("debug", "Attempting to refresh Cloudflare TURN credentials...");

    -- Use cached raw API response if still valid
    local now = os_time();
    if cf_api_response_cache.expiry > now and cf_api_response_cache.data then
        module:log("debug", "Using cached Cloudflare API response for Prosody update.");
        local prosody_services = convert_cf_ice_servers_to_prosody_format(cf_api_response_cache.data);
        update_prosody_service_items(prosody_services);
        return;
    end

    module:log("debug", "Cache expired or empty, fetching fresh data from Cloudflare API.");
    get_fresh_cf_data(function(cf_ice_servers_array_from_api)
        if cf_ice_servers_array_from_api then
            -- Cache the new raw response
            cf_api_response_cache.data = cf_ice_servers_array_from_api;
            cf_api_response_cache.expiry = os_time() + cf_turn_ttl; -- Use configured TTL for cache expiry

            local prosody_services = convert_cf_ice_servers_to_prosody_format(cf_ice_servers_array_from_api);
            update_prosody_service_items(prosody_services);
        else
            module:log("warn", "Failed to obtain fresh credentials from Cloudflare. Old credentials may persist if not expired, or no credentials will be available if this is the first run.");
            -- Potentially clear existing items if fetch fails consistently to avoid serving very old data,
            -- or rely on their TTLs as handled by mod_external_services. For now, we don't clear on failure.
        end
    end);
end

-- Module load function
function module.load()
    update_config_options(); -- Load initial config

    if not (cf_turn_app_id and cf_turn_app_secret) then
        module:log("warn", "Cloudflare TURN App ID or Secret not configured. Module will be idle.");
        module:set_status("warn", "Not configured (cf_turn_app_id or cf_turn_app_secret missing)");
        return;
    end
    module:set_status("info", "Initializing...");

    refresh_and_update_credentials(); -- Initial fetch and update

    local refresh_interval = cf_turn_ttl / 2;
    -- Ensure a sane minimum refresh interval, e.g., 5 minutes (300s)
    if refresh_interval < 300 then refresh_interval = 300; end
    -- Ensure it's not longer than the TTL itself if TTL is very short (though unlikely for TURN)
    if refresh_interval > cf_turn_ttl and cf_turn_ttl > 0 then refresh_interval = cf_turn_ttl; end


    module:log("info", "Cloudflare TURN module loaded. Credentials will refresh approx. every %d seconds.", refresh_interval);

    module:add_timer(refresh_interval, function()
        -- Check if config is still valid before refreshing
        if not (cf_turn_app_id and cf_turn_app_secret) then
            module:log("debug", "CF TURN not configured, timer stopping and clearing services.");
            update_prosody_service_items(nil); -- Clear any existing items
            cf_api_response_cache = { data = nil, expiry = 0 }; -- Clear API cache
            module:set_status("warn", "Not configured (cf_turn_app_id or cf_turn_app_secret missing)");
            return; -- Stop timer if config removed/invalidated
        end

        refresh_and_update_credentials();

        -- Recalculate interval in case TTL changed via config reload for the next run
        local current_refresh_interval = cf_turn_ttl / 2;
        if current_refresh_interval < 300 then current_refresh_interval = 300; end
        if current_refresh_interval > cf_turn_ttl and cf_turn_ttl > 0 then current_refresh_interval = cf_turn_ttl; end
        return current_refresh_interval; -- Reschedule timer
    end);
    module:set_status("info", "Running and scheduled for periodic refresh.");
end

-- Handle Prosody configuration reloads
module:hook_global("config-reloaded", function()
    module:log("info", "Configuration reloaded, updating Cloudflare TURN settings.");
    local old_app_id = cf_turn_app_id;
    local old_app_secret = cf_turn_app_secret;
    local old_ttl = cf_turn_ttl;

    update_config_options(); -- This will load new values for cf_turn_app_id, cf_turn_app_secret, cf_turn_ttl etc.

    if not (cf_turn_app_id and cf_turn_app_secret) then
        module:log("warn", "Cloudflare TURN configuration removed or incomplete after reload. Clearing services and stopping activity.");
        update_prosody_service_items(nil); -- Clear any services previously added
        cf_api_response_cache = { data = nil, expiry = 0 }; -- Clear API cache
        module:set_status("warn", "Not configured after reload.");
        -- The timer will stop itself on its next execution due to the check.
    -- If core config changed (ID, secret, or significantly different TTL), force refresh.
    elseif old_app_id ~= cf_turn_app_id or old_app_secret ~= cf_turn_app_secret or old_ttl ~= cf_turn_ttl then
        module:log("info", "Cloudflare TURN configuration changed, forcing credential refresh.");
        cf_api_response_cache = { data = nil, expiry = 0 }; -- Clear API cache to force fetch with new settings/TTL
        refresh_and_update_credentials(); -- Refresh immediately with new settings
        module:set_status("info", "Running with new configuration.");
    else
        module:log("debug", "Cloudflare TURN configuration re-evaluated, no significant changes detected.");
        module:set_status("info", "Running."); -- Status remains OK
    end
    -- The timer will automatically use the new cf_turn_ttl for its next rescheduling interval.
end);