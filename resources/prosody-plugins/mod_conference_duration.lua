local it = require "util.iterators";
local process_host_module = module:require "util".process_host_module;

local main_muc_component_config = module:get_option_string('main_muc');
if main_muc_component_config == nil then
    module:log('error', 'lobby not enabled missing main_muc config');
    return ;
end

-- Returns the meeting created timestamp form data.
function getMeetingCreatedTSConfig(room)
    return {
        name = "muc#roominfo_created_timestamp";
        type = "text-single";
        label = "The meeting created_timestamp.";
        value = room.created_timestamp or "";
    };
end

function occupant_joined(event)
    local room = event.room;
    local occupant = event.occupant;

    local participant_count = it.count(room:each_occupant());

    if participant_count > 1 then
        if room.created_timestamp == nil then
            room.created_timestamp = string.format('%i', os.time() * 1000); -- Lua provides UTC time in seconds, so convert to milliseconds
        end
    end
end

process_host_module(main_muc_component_config, function(host_module, host)
    -- add meeting Id to the disco info requests to the room
    host_module:hook("muc-disco#info", function(event)
        table.insert(event.form, getMeetingCreatedTSConfig(event.room));
    end);

    -- Marks the created timestamp in the room object
    host_module:hook("muc-occupant-joined", occupant_joined, -1);
end);

-- DEPRECATED and will be removed, giving time for mobile clients to update
local conference_duration_component
    = module:get_option_string("conference_duration_component", "conferenceduration."..module.host);
if conference_duration_component then
    module:add_identity("component", "conference_duration", conference_duration_component);
end
