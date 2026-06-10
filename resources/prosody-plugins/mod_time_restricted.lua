
local MIN = module:get_option_number("conference_max_minutes", 5)
local TIMEOUT = MIN * 60

local is_healthcheck_room = module:require "util".is_healthcheck_room
local st = require "util.stanza"
local array = require "util.array";
module:log('info', "loaded")

local restricted_rooms = array{};

module:hook("muc-room-created", function (event)
    local room = event.room

    if is_healthcheck_room(room.jid) then
        return
    end

    room.destroy_timer = module:add_timer(TIMEOUT, function()
        if is_healthcheck_room(room.jid) then
            return
        end
        restricted_rooms[room.jid] = true;
        room:destroy(nil, string.format('This meeting reached its %d-minute time limit and has ended.', MIN));

        module:log('info', "the conference terminated %s", room.jid);
    end)
end)

module:hook("muc-room-pre-create", function(event)
    local origin, stanza, room = event.origin, event.stanza, event.room;

    if is_healthcheck_room(room.jid) then
        return
    end

    if restricted_rooms[room.jid] then
        module:log('info', "the conference id blocked %s", room.jid);
        origin.send(st.error_reply(stanza, "cancel", "resource-constraint", nil, module.host));
        return true;
    end
end, 200);

module:hook('muc-room-destroyed',function(event)
    local room = event.room;
    if room.destroy_timer then
        room.destroy_timer:stop();
        room.destroy_timer = nil;
    end
end, 1); -- prosody handles it at 0
