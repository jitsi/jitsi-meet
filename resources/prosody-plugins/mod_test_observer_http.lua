-- Test-only module. Never load in production.
-- Serves HTTP endpoints for test assertions. Must be loaded on the main VirtualHost
-- (not the MUC component) so that plain HTTP on port 5280 is reachable with
-- Host: localhost — the VirtualHost's domain.
--
-- Data is supplied by mod_test_observer (loaded on the MUC component) via
-- module:shared. Load order does not matter; shared tables are created lazily.

local json = require "cjson.safe";

-- /conference.localhost/mod_test_observer is the absolute path for the shared
-- table created by mod_test_observer running on conference.localhost.
local MUC_HOST = module:get_option_string("muc_mapper_domain_base", "localhost");
local MUC_COMPONENT = module:get_option_string("muc_mapper_domain_prefix", "conference") .. "." .. MUC_HOST;
local shared = module:shared("/" .. MUC_COMPONENT .. "/mod_test_observer");

local function urldecode(s)
    return (s:gsub("%%(%x%x)", function(hex)
        return string.char(tonumber(hex, 16));
    end));
end

local function parse_query(q)
    local params = {};
    for k, v in (q or ""):gmatch("([^&=]+)=([^&]*)") do
        params[urldecode(k)] = urldecode(v);
    end
    return params;
end

module:provides("http", {
    default_path = "/test-observer";
    route = {
        ["GET /events"] = function()
            local events = shared.events or {};
            -- cjson encodes an empty Lua table as {} (object); force array literal.
            local body = #events == 0 and "[]" or json.encode(events);
            return {
                status_code = 200;
                headers = { ["Content-Type"] = "application/json" };
                body = body;
            };
        end;

        ["DELETE /events"] = function()
            -- Replace with a fresh table; mod_test_observer always reads shared.events
            -- via the shared reference so it will see the new table immediately.
            shared.events = {};
            return { status_code = 204 };
        end;

        -- POST /test-observer/rooms/max-occupants
        -- Body: { "jid": "room@conference.localhost", "max_occupants": 4 }
        -- Sets room._data.max_occupants so per-room limit tests can override the
        -- global muc_max_occupants without restarting Prosody.
        ["POST /rooms/max-occupants"] = function(event)
            local data = json.decode(event.request.body or "{}") or {};
            local room_jid = data.jid;
            local max = tonumber(data.max_occupants);
            if not room_jid or not max then
                return { status_code = 400; body = '{"error":"missing jid or max_occupants"}' };
            end
            local room = (shared.rooms or {})[room_jid];
            if not room then
                return { status_code = 404; body = '{"error":"room not found"}' };
            end
            room._data.max_occupants = max;
            return {
                status_code = 200;
                headers = { ["Content-Type"] = "application/json" };
                body = '{"ok":true}';
            };
        end;

        -- GET /test-observer/rooms?jid=room@conference.localhost
        -- Returns: { jid, hidden, occupant_count }
        ["GET /rooms"] = function(event)
            local params = parse_query(event.request.url.query);
            local room_jid = params["jid"];
            if not room_jid then
                return { status_code = 400; body = '{"error":"missing jid param"}' };
            end
            local rooms = shared.rooms or {};
            local room = rooms[room_jid];
            if not room then
                return { status_code = 404; body = '{"error":"room not found"}' };
            end
            local count = 0;
            for _ in room:each_occupant() do count = count + 1; end
            return {
                status_code = 200;
                headers = { ["Content-Type"] = "application/json" };
                body = json.encode({
                    jid = room.jid;
                    hidden = room:get_hidden();
                    occupant_count = count;
                });
            };
        end;
    };
});

module:log("info", "test_observer_http loaded");
