-- Test-only module. Never load in production.
-- Hooks MUC events on the conference component and stores them in a shared table
-- so that mod_test_observer_http (loaded on the main VirtualHost) can serve them
-- over plain HTTP without virtual-host routing conflicts.

-- Shared table. Absolute path so mod_test_observer_http (on a different host)
-- can access the same table via module:shared("/<this_host>/mod_test_observer").
-- module:shared() uses the path string as-is — no automatic host prefix.
local shared = module:shared("/" .. module.host .. "/mod_test_observer");
if not shared.events then shared.events = {}; end
if not shared.rooms  then shared.rooms  = {}; end

local tracked = {
    "muc-room-pre-create";
    "muc-room-created";
    "muc-occupant-pre-join";
    "muc-occupant-joined";
    "muc-occupant-left";
    "muc-room-destroyed";
};

for _, name in ipairs(tracked) do
    module:hook(name, function(event)
        local entry = { event = name, timestamp = os.time() };
        if event.room then entry.room = event.room.jid end
        if event.occupant then entry.occupant = tostring(event.occupant.bare_jid) end
        table.insert(shared.events, entry);
    end, -1000); -- run after all other handlers
end

-- Keep a live reference to each room so mod_test_observer_http can query state
-- without needing get_room_from_jid (which is not accessible from the VirtualHost
-- module's context in Prosody 13).
module:hook("muc-room-created", function(event)
    shared.rooms[event.room.jid] = event.room;
end, -999);

module:hook("muc-room-destroyed", function(event)
    shared.rooms[event.room.jid] = nil;
end, -999);

module:log("info", "test_observer loaded");
