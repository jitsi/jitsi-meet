local cache = require "util.cache";
local queue = require "util.queue";
local uuid_gen = require "util.uuid".generate;
local main_util = module:require "util";
local ends_with = main_util.ends_with;
local is_healthcheck_room = main_util.is_healthcheck_room;
local internal_room_jid_match_rewrite = main_util.internal_room_jid_match_rewrite;
local presence_check_status = main_util.presence_check_status;

local um_is_admin = require 'core.usermanager'.is_admin;
local function is_admin(jid)
    return um_is_admin(jid, module.host);
end

local QUEUE_MAX_SIZE = 500;

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

-- disabled few options for room config, to not mess with visitor logic
module:hook("muc-config-submitted/muc#roomconfig_moderatedroom", function()
    return true;
end, 99);
module:hook("muc-config-submitted/muc#roomconfig_presencebroadcast", function()
    return true;
end, 99);
module:hook("muc-config-submitted/muc#roominfo_meetingId", function(event)
    -- we allow jicofo to overwrite the meetingId
    if is_admin(event.actor) then
        event.room._data.meetingId = event.value;
        return;
    end

    return true;
end, 99);
module:hook('muc-broadcast-presence', function (event)
    local actor, occupant, room, x = event.actor, event.occupant, event.room, event.x;
    if presence_check_status(x, '307') then
        -- make sure we update and affiliation for kicked users
        room:set_affiliation(actor, occupant.bare_jid, 'none');
    end
end);

--- START logic for waiting jicofo to be the first in the room
-- stores presences for participants that tried to create a room, we let jicofo do that and process the waiting
-- presences so the participants can join after jicofo and do not let them receive not-allowed error because
-- only jicofo is allowed to create rooms
local rooms_pre_join_queue = cache.new(1000);

--- Avoids any participant joining the room in the interval between creating the room
--- and jicofo entering the room
module:hook('muc-room-pre-create', function (event)
    local room, stanza = event.room, event.stanza;

    if not is_admin(stanza.attr.from) then
        local pre_join_queue = rooms_pre_join_queue:get(room.jid);
        if not pre_join_queue then
            pre_join_queue = queue.new(QUEUE_MAX_SIZE);
            rooms_pre_join_queue:set(room.jid, pre_join_queue);
        end

        if not pre_join_queue:push(event) then
            module:log('error', 'Error enqueuing occupant event for: %s', occupant.nick);
            return true;
        end

        -- stop processing
        return true;
    end
end, 1); -- the room creation check is on default priority 0

-- unlock room when jicofo for real is in the room
module:hook('muc-occupant-joined', function (event)
    local room = event.room;

    -- we skip processing only if jicofo_lock is set to false
    if room._data.jicofo_lock == false or is_healthcheck_room(room.jid) then
        return;
    end

    local occupant = event.occupant;
    if is_admin(occupant.bare_jid) then
        module:fire_event('jicofo-unlock-room', { room = room; });
    end
end);

function handle_jicofo_unlock(event)
    local room = event.room;

    room._data.jicofo_lock = false;

    local pre_join_queue = rooms_pre_join_queue:get(room.jid);
    if not pre_join_queue then
        return;
    end

    -- and now let's handle all pre_join_queue events
    for _, ev in pre_join_queue:items() do
        -- if the connection was closed while waiting in the queue, ignore
        if ev.origin.conn then
            room:handle_normal_presence(ev.origin, ev.stanza);
        end
    end
    rooms_pre_join_queue:set(room.jid, nil);
end

module:hook('jicofo-unlock-room', handle_jicofo_unlock);

module:hook('muc-room-destroyed',function(event)
    rooms_pre_join_queue:set(event.room.jid, nil);
end);

--- END logic for waiting jicofo to be the first in the room

-- make sure we remove nick if someone is sending it with a message to protect
-- forgery of display name
module:hook("muc-occupant-groupchat", function(event)
    event.stanza:remove_children('nick', 'http://jabber.org/protocol/nick');
end, 45); -- prosody check is prio 50, we want to run after it
