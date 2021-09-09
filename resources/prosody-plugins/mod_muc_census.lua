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
local json = require "util.json";
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

--- handles request to get number of participants in all rooms
-- @return GET response
function handle_get_room_census(event)
    local host_session = prosody.hosts[muc_domain_prefix .. "." .. tostring(module.host)]
    if not host_session or not host_session.modules.muc then
        return { status_code = 400; }
    end

    room_data = {}
    for room in host_session.modules.muc.each_room() do
        if not is_healthcheck_room(room.jid) then
            local occupants = room._occupants;
            if occupants then
                participant_count = iterators.count(room:each_occupant()) - 1; -- subtract focus
            else
                participant_count = 0
            end
            table.insert(room_data, {
                room_name = room.jid;
                participants = participant_count;
                created_time = room.created_timestamp;
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
