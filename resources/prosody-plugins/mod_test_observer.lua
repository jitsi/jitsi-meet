-- Test-only module. Never load in production.
-- Hooks MUC events on the conference component and stores them in a shared table
-- so that mod_test_observer_http (loaded on the main VirtualHost) can serve them
-- over plain HTTP without virtual-host routing conflicts.

-- Shared table. Absolute path so mod_test_observer_http (on a different host)
-- can access the same table via module:shared("/<this_host>/mod_test_observer").
-- module:shared() uses the path string as-is — no automatic host prefix.
local shared = module:shared("/" .. module.host .. "/mod_test_observer");
if not shared.events    then shared.events    = {}; end
if not shared.rooms     then shared.rooms     = {}; end
if not shared.jibri_iqs then shared.jibri_iqs = {}; end
if not shared.dial_iqs  then shared.dial_iqs  = {}; end

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

-- Record Jibri IQs that reach the MUC component (i.e. passed mod_filter_iq_jibri).
-- If the filter blocks an IQ it never arrives here, so absence = blocked.
-- High priority (500) so this runs before mod_muc's iq/full handler, which
-- returns non-nil and would prevent lower-priority hooks from firing.
-- Guard: only record IQs addressed to this component (to = room@<this_host>/nick).
-- The MUC re-routes the IQ to the occupant's real JID on another host, which
-- would fire iq/full a second time — skip those forwarded copies.
local jid_util = require "util.jid";
module:hook("iq/full", function(event)
    local stanza = event.stanza;
    -- Only capture initial requests; ignore error/result responses routed back
    -- through the MUC (e.g. @xmpp/client auto-replying to unhandled IQs).
    local iq_type = stanza.attr.type;
    if iq_type ~= "set" and iq_type ~= "get" then return; end
    local _, to_host = jid_util.split(stanza.attr.to);
    if to_host ~= module.host then return; end
    local jibri = stanza:get_child('jibri', 'http://jitsi.org/protocol/jibri');
    if jibri then
        table.insert(shared.jibri_iqs, {
            from           = stanza.attr.from;
            to             = stanza.attr.to;
            action         = jibri.attr.action;
            recording_mode = jibri.attr.recording_mode;
        });
    end
    local dial = stanza:get_child('dial', 'urn:xmpp:rayo:1');
    if dial then
        -- Extract JvbRoomName header value for assertion.
        local room_name_header;
        for _, child in ipairs(dial.tags) do
            if child.name == "header" and child.attr.name == "JvbRoomName" then
                room_name_header = child.attr.value;
            end
        end
        table.insert(shared.dial_iqs, {
            from             = stanza.attr.from;
            to               = stanza.attr.to;
            dial_to          = dial.attr.to;
            room_name_header = room_name_header;
        });
    end
end, 500);

module:log("info", "test_observer loaded");
