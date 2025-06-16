-- provides an http endpoint at /room-census that reports list of rooms with the
-- number of members and created date in this JSON format:
--
--     {
--         "room_census": [
--             {
--                 "room_name": "<muc name>",
--                 "participants": <# participants>,
--                 "created_time": <unix timestamp>,
--             },
--             ...
--         ]
--     }
--
-- to activate, add "muc_census" to the modules_enabled table in prosody.cfg.lua
--
-- warning: this module is unprotected and intended for server admin use only.
-- when enabled, make sure to secure the endpoint at the web server or via
-- network filters

local jid = require "util.jid";
local json = require 'cjson.safe';
local iterators = require "util.iterators";
local util = module:require "util";
local is_healthcheck_room = util.is_healthcheck_room;

local have_async = pcall(require, "util.async");
if not have_async then
    module:log("error", "requires a version of Prosody with util.async");
    return;
end

local async_handler_wrapper = module:require "util".async_handler_wrapper;

local tostring = tostring;

-- required parameter for custom muc component prefix, defaults to "conference"
local muc_domain_prefix = module:get_option_string("muc_mapper_domain_prefix", "conference");

local leaked_rooms = 0;

--- handles request to get number of participants in all rooms
-- @return GET response
function handle_get_room_census(event)
    local host_session = prosody.hosts[muc_domain_prefix .. "." .. tostring(module.host)]
    if not host_session or not host_session.modules.muc then
        return { status_code = 400; }
    end

    room_data = {}
    leaked_rooms = 0;
    for room in host_session.modules.muc.each_room() do
        if not is_healthcheck_room(room.jid) then
            local occupants = room._occupants;
            local participant_count = 0;
            local missing_connections_count = 0;

            if occupants then
                for _, o in room:each_occupant() do
                    participant_count = participant_count + 1;

                    -- let's check whether that occupant has connection in the full_sessions of prosody
                    -- attempt to detect leaked occupants/rooms.
                    if prosody.full_sessions[o.jid] == nil then
                        missing_connections_count = missing_connections_count + 1;
                    end
                end
                participant_count = participant_count - 1; -- subtract focus
            end

            local leaked = false;
            if participant_count > 0 and missing_connections_count == participant_count then
                leaked = true;
                leaked_rooms = leaked_rooms + 1;
            end

            table.insert(room_data, {
                room_name = room.jid;
                participants = participant_count;
                created_time = room.created_timestamp;
                leaked = leaked;
            });
        end
    end

    census_resp = json.encode({
        room_census = room_data;
    });
    return { status_code = 200; body = census_resp }
end

function module.load()
    module:depends("http");
        module:provides("http", {
                default_path = "/";
                route = {
                        ["GET room-census"] = function (event) return async_handler_wrapper(event,handle_get_room_census) end;
                };
        });
end

-- we calculate the stats on the configured interval (60 seconds by default)
local measure_leaked_rooms = module:measure('leaked_rooms', 'amount');
module:hook_global('stats-update', function ()
    measure_leaked_rooms(leaked_rooms);
end);
