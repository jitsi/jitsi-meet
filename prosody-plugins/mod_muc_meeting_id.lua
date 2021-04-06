local uuid_gen = require "util.uuid".generate;
local is_healthcheck_room = module:require "util".is_healthcheck_room;

-- Module that generates a unique meetingId, attaches it to the room
-- and adds it to all disco info form data (when room is queried or in the
-- initial room owner config)

-- Hook to assign meetingId for new rooms
module:hook("muc-room-created", function(event)
    local room = event.room;

    if is_healthcheck_room(room.jid) then
        return;
    end

    room._data.meetingId = uuid_gen();

    module:log("debug", "Created meetingId:%s for %s",
        room._data.meetingId, room.jid);
end);

-- Returns the meeting config Id form data.
function getMeetingIdConfig(room)
    return {
        name = "muc#roominfo_meetingId";
        type = "text-single";
        label = "The meeting unique id.";
        value = room._data.meetingId or "";
    };
end

-- add meeting Id to the disco info requests to the room
module:hook("muc-disco#info", function(event)
    table.insert(event.form, getMeetingIdConfig(event.room));
end);

-- add the meeting Id in the default config we return to jicofo
module:hook("muc-config-form", function(event)
    table.insert(event.form, getMeetingIdConfig(event.room));
end, 90-3);
