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
--                                  regular user and at least one jibri or
--                                  transcriber remains, with no regular user;
--                                  skip entirely if the leaver is admin, jibri,
--                                  or transcriber, or if breakout_rooms_active.
--   muc-room-destroyed   (1)    — cancel and clear the timer reference.
--
-- The timer must not start for a room that has no backend service. When the
-- last occupant leaves, mod_muc (priority -1) fires muc-room-destroyed before
-- this module's muc-occupant-left handler runs, and it does not set
-- room.destroying. A timer started then outlives the room. When it fires,
-- room:destroy() on the old room object removes the room jid from the MUC,
-- and a new room with the same jid that is live at that time is lost.

local util = module:require 'util';
local get_room_from_jid = util.get_room_from_jid;
local is_admin = util.is_admin;
local is_healthcheck_room = util.is_healthcheck_room;
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

    local has_backend_service = false;

    for _, o in room:each_occupant() do
        if is_jibri(o.jid) or is_transcriber(o.jid) then
            has_backend_service = true;
        elseif not is_admin(o.bare_jid) then
            -- a regular participant is still in the room
            return;
        end
    end

    -- No jibri or transcriber: the room is empty (already destroyed by mod_muc)
    -- or has only admins (jicofo), which leave the room on their own.
    if not has_backend_service then
        return;
    end

    -- the room only has jibri and transcriber, add a timeout to destroy the room
    if room.empty_destroy_timer then
        room.empty_destroy_timer:stop();
    end
    room.empty_destroy_timer = module:add_timer(EMPTY_TIMEOUT, function()
        -- Do not act on an old room object. A new room with the same jid can exist.
        if room.destroying or get_room_from_jid(room.jid) ~= room then
            return;
        end

        module:log('info',
            'the conference terminated %s as being empty for %s seconds with recording/transcribing enabled.',
            room.jid, EMPTY_TIMEOUT);

        room:destroy(nil, 'Empty room with recording and/or transcribing.');
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
