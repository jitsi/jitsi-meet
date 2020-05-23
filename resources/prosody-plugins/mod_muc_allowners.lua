local is_healthcheck_room = module:require "util".is_healthcheck_room;

module:hook("muc-occupant-joined", function (event)
    local room, occupant = event.room, event.occupant;

    if is_healthcheck_room(room.jid) then
        return;
    end

    room:set_affiliation(true, occupant.bare_jid, "owner");
end, 2);

module:hook("muc-occupant-left", function (event)
    local room, occupant = event.room, event.occupant;

    if is_healthcheck_room(room.jid) then
        return;
    end

    room:set_affiliation(true, occupant.bare_jid, nil);
end, 2);
