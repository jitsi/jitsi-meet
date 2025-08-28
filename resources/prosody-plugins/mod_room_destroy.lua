-- Handle room destroy requests it such a way that it can be suppressed by other
-- modules that handle room lifecycle and wish to keep the room alive.

function handle_room_destroy(event)
    local room = event.room;
    local reason = event.reason;
    local caller = event.caller;

    module:log('info', 'Destroying room %s (requested by %s)', room.jid, caller);
    room:set_persistent(false);
    room:destroy(nil, reason);
end

module:hook_global("maybe-destroy-room", handle_room_destroy, -1);
module:log('info', 'loaded');
