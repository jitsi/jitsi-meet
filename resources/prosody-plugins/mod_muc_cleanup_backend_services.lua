-- Module to be enabled under the main MUC component.
-- Destroys a conference room after a configurable timeout (default 20 s,
-- overridable via services_empty_meeting_timeout) when the room is left
-- occupied only by backend services — Jibri recorders or transcribers —
-- with no regular participants remaining.
--
-- Identity is determined by JID prefix (util.lib.lua):
--   is_jibri():       JID starts with 'recorder@recorder.', 'jibria@recorder.',
--                     or 'jibrib@recorder.'
--   is_transcriber(): JID starts with 'transcriber@recorder.',
--                     'transcribera@recorder.', or 'transcriberb@recorder.'
--   is_admin():       bare JID is in the Prosody admins list
--
-- Hook summary:
--   muc-occupant-joined  (-100) — cancel the destroy timer when a regular user
--                                  (not jibri, not transcriber) joins.
--   muc-occupant-left    (-100) — start the destroy timer when the leaver is a
--                                  regular user and only backend services remain;
--                                  skip entirely if the leaver is admin, jibri,
--                                  or transcriber, or if breakout_rooms_active.
--   muc-room-destroyed   (1)    — cancel and clear the timer reference.

local util = module:require 'util';
local is_admin = util.is_admin;
local is_transcriber = util.is_transcriber;
local is_jibri = util.is_jibri;

local EMPTY_TIMEOUT = module:get_option_number('services_empty_meeting_timeout', 20);

module:hook('muc-occupant-joined', function (event)
    local room = event.room;
    local occupant = event.occupant;

    if is_healthcheck_room(room.jid) or is_admin(occupant.bare_jid) then
        return;
    end

    -- clear the timer when someone joins
    if not is_jibri(occupant.jid) and not is_transcriber(occupant.jid) and room.empty_destroy_timer then
        room.empty_destroy_timer:stop();
        room.empty_destroy_timer = nil;
    end
end, -100); -- make sure we are last in the chain

module:hook('muc-occupant-left', function (event)
    local occupant, room = event.occupant, event.room;

    if is_admin(occupant.bare_jid) or is_jibri(occupant.jid) or is_transcriber(occupant.jid)
        or room._data.breakout_rooms_active then
        return;
    end

    for _, o in room:each_occupant() do
        if not is_jibri(o.jid) and not is_transcriber(o.jid)
            and not is_admin(o.bare_jid) then
            -- not empty
            return;
        end
    end

    -- seems the room only has jibri and transcriber, add a timeout to destroy the room
    if room.empty_destroy_timer then
        room.empty_destroy_timer:stop();
    end
    room.empty_destroy_timer = module:add_timer(EMPTY_TIMEOUT, function()
        if room.destroying then return end
        room:destroy(nil, 'Empty room with recording and/or transcribing.');

        module:log('info',
            'the conference terminated %s as being empty for %s seconds with recording/transcribing enabled. By %s',
            room.jid, EMPTY_TIMEOUT, room.empty_destroy_timer);
    end)
    module:log('info', 'Added room destroy timer %s for %s', room.empty_destroy_timer, room.jid);
end, -100); -- the last thing to execute

module:hook('muc-room-destroyed', function (event)
    local room = event.room;
    if room.empty_destroy_timer then
        room.empty_destroy_timer:stop();
        room.empty_destroy_timer = nil;
    end
end, 1); -- prosody handles it at 0
