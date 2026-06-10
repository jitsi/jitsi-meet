
local MIN = module:get_option_number("conference_max_minutes", 5)
local TIMEOUT = MIN * 60

-- Half the meeting; the moment we tell clients to start the visible countdown.
local NOTIFY_AT = math.floor(TIMEOUT / 2)

local is_healthcheck_room = module:require "util".is_healthcheck_room
local st = require "util.stanza"
local json = require "cjson.safe"
local array = require "util.array";
module:log('info', "loaded")

local restricted_rooms = array{};

-- The `type` the time-timer feature in jitsi-meet matches on. Sent as a
-- json-message from the room JID so lib-jitsi-meet surfaces it as a
-- NON_PARTICIPANT_MESSAGE_RECEIVED (a server-originated, non-participant
-- message) rather than a participant endpoint message.
local TIME_RESTRICTED_MESSAGE_TYPE = 'time_restricted';

-- Sends the time-timer json-message to a single occupant. `durationSeconds` is
-- the full meeting length and `elapsedSeconds` how far in we are, so a late
-- joiner lands on the same countdown everyone else already sees.
local function send_time_timer(room, to_jid)
    local elapsed = os.time() - (room.time_restricted_created or os.time());
    local body, error = json.encode({
        type = TIME_RESTRICTED_MESSAGE_TYPE;
        durationSeconds = TIMEOUT;
        elapsedSeconds = elapsed;
    });

    if not body then
        module:log('error', 'failed to encode time-timer message room:%s error:%s', room.jid, error);
        return;
    end

    -- from = room.jid so the stanza routes through ChatRoom.onMessage in
    -- lib-jitsi-meet (which only processes messages whose bare from matches the
    -- room) and is emitted as JSON_MESSAGE_RECEIVED -> NON_PARTICIPANT_MESSAGE_RECEIVED.
    local stanza = st.message({ from = room.jid; to = to_jid; })
        :tag('json-message', { xmlns = 'http://jitsi.org/jitmeet' }):text(body):up();
    module:send(stanza);
end

module:hook("muc-room-created", function (event)
    local room = event.room

    if is_healthcheck_room(room.jid) then
        return
    end

    room.time_restricted_created = os.time();

    -- At the half-way point tell every occupant to start the visible countdown
    -- for the remaining time.
    room.notify_timer = module:add_timer(NOTIFY_AT, function()
        if is_healthcheck_room(room.jid) then
            return
        end

        for _, occupant in room:each_occupant() do
            send_time_timer(room, occupant.jid);
        end

        module:log('info', "time-timer notification sent for %s", room.jid);
    end)

    room.destroy_timer = module:add_timer(TIMEOUT, function()
        if is_healthcheck_room(room.jid) then
            return
        end
        restricted_rooms[room.jid] = true;
        room:destroy(nil, string.format('This meeting reached its %d-minute time limit and has ended.', MIN));

        module:log('info', "the conference terminated %s", room.jid);
    end)
end)

-- A participant joining after the half-way point missed the broadcast above;
-- give them the same countdown so everyone is in sync.
module:hook("muc-occupant-joined", function (event)
    local room, occupant = event.room, event.occupant;

    if is_healthcheck_room(room.jid) then
        return
    end

    if room.time_restricted_created
            and (os.time() - room.time_restricted_created) >= NOTIFY_AT then
        send_time_timer(room, occupant.jid);
    end
end);

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
    if room.notify_timer then
        room.notify_timer:stop();
        room.notify_timer = nil;
    end
    if room.destroy_timer then
        room.destroy_timer:stop();
        room.destroy_timer = nil;
    end
end, 1); -- prosody handles it at 0