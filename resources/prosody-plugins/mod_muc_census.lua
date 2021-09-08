-- report list of rooms with # of members and created date, filtered on test rooms

local jid = require "util.jid";
local json = require "util.json";
local iterators = require "util.iterators";

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
-- @return GET response, containing json in this form:
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
function handle_get_room_census(event)
    local host_session = prosody.hosts["conference." .. tostring(module.host)]
    if not host_session or not host_session.modules.muc then
        return { status_code = 400; }
    end

    room_data = {}
    for room in host_session.modules.muc.each_room() do
        if not tostring(room.jid):find("__jicofo-health-check", 1, true) then -- filter out test rooms
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
