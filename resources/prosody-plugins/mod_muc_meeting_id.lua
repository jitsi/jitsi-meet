local jid = require 'util.jid';
local json = require 'cjson.safe';
local queue = require "util.queue";
local uuid_gen = require "util.uuid".generate;
local main_util = module:require "util";
local is_admin = main_util.is_admin;
local ends_with = main_util.ends_with;
local get_room_from_jid = main_util.get_room_from_jid;
local is_healthcheck_room = main_util.is_healthcheck_room;
local internal_room_jid_match_rewrite = main_util.internal_room_jid_match_rewrite;
local presence_check_status = main_util.presence_check_status;
local extract_subdomain = main_util.extract_subdomain;

local QUEUE_MAX_SIZE = 500;

module:depends("jitsi_permissions");

-- Common module for all logic that can be loaded under the conference muc component.
--
-- This module:
-- a) Generates a unique meetingId, attaches it to the room and adds it to all disco info form data
--    (when room is queried or in the initial room owner config).
-- b) Updates user region (obtain it from the incoming http headers) in the occupant's presence on pre-join.
-- c) Avoids any participant joining the room in the interval between creating the room and jicofo entering the room.
-- d) Removes any nick that maybe set to messages being sent to the room.
-- e) Fires event for received endpoint messages (optimization to decode them once).

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

local function process_region(session, stanza)
    if not session.user_region then
        return;
    end

    local region = stanza:get_child_text('jitsi_participant_region');
    if region then
        return;
    end

    stanza:tag('jitsi_participant_region'):text(session.user_region):up();
end

--- Avoids any participant joining the room in the interval between creating the room
--- and jicofo entering the room
module:hook('muc-occupant-pre-join', function (event)
    local occupant, room, stanza = event.occupant, event.room, event.stanza;

    local is_health_room = is_healthcheck_room(room.jid);
    -- check for region
    if not is_admin(occupant.bare_jid) and not is_health_room then
        process_region(event.origin, stanza);
    end

    -- we skip processing only if jicofo_lock is set to false
    if room._data.jicofo_lock == false or is_health_room then
        return;
    end

    if ends_with(occupant.nick, '/focus') then
        module:fire_event('jicofo-unlock-room', { room = room; });
    else
        room._data.jicofo_lock = true;
        if not room.pre_join_queue then
            room.pre_join_queue = queue.new(QUEUE_MAX_SIZE);
        end

        if not room.pre_join_queue:push(event) then
            module:log('error', 'Error enqueuing occupant event for: %s', occupant.nick);
            return true;
        end
        module:log('debug', 'Occupant pushed to prejoin queue %s', occupant.nick);

        -- stop processing
        return true;
    end
end, 8); -- just after the rate limit

function handle_jicofo_unlock(event)
    local room = event.room;

    room._data.jicofo_lock = false;
    if not room.pre_join_queue then
        return;
    end

    -- and now let's handle all pre_join_queue events
    for _, ev in room.pre_join_queue:items() do
        -- if the connection was closed while waiting in the queue, ignore
        if ev.origin.conn then
            module:log('debug', 'Occupant processed from queue %s', ev.occupant.nick);
            room:handle_normal_presence(ev.origin, ev.stanza);
        end
    end
    room.pre_join_queue = nil;
end

module:hook('jicofo-unlock-room', handle_jicofo_unlock);

-- make sure we remove nick if someone is sending it with a message to protect
-- forgery of display name
module:hook("muc-occupant-groupchat", function(event)
    event.stanza:remove_children('nick', 'http://jabber.org/protocol/nick');
end, 45); -- prosody check is prio 50, we want to run after it

module:hook('message/bare', function(event)
    local stanza = event.stanza;

    if stanza.attr.type ~= 'groupchat' then
        return nil;
    end

    -- we are interested in all messages without a body
    local body = stanza:get_child('body')
    if body then
        return;
    end

    local room = get_room_from_jid(stanza.attr.to);
    if not room then
        module:log('warn', 'No room found found for %s', stanza.attr.to);
        return;
    end

    local occupant_jid = stanza.attr.from;
    local occupant = room:get_occupant_by_real_jid(occupant_jid);
    if not occupant then
        module:log("error", "Occupant sending msg %s was not found in room %s", occupant_jid, room.jid)
        return;
    end

    local json_message = stanza:get_child_text('json-message', 'http://jitsi.org/jitmeet');
    if not json_message then
        return;
    end

    -- TODO: add optimization by moving type and certain fields like is_interim as attribute on 'json-message'
    -- using string find is roughly 70x faster than json decode for checking the value
    if string.find(json_message, '"is_interim":true', 1, true) then
        return;
    end

    local msg_obj, error = json.decode(json_message);

    if error then
        module:log('error', 'Error decoding data error:%s Sender: %s to:%s', error, stanza.attr.from, stanza.attr.to);
        return true;
    end

    if msg_obj.transcript ~= nil then
        local transcription = msg_obj;

        -- in case of the string matching optimization above failed
        if transcription.is_interim then
            return;
        end

        -- TODO what if we have multiple alternative transcriptions not just 1
        local text_message = transcription.transcript[1].text;
        --do not send empty messages
        if text_message == '' then
            return;
        end

        local user_id = transcription.participant.id;
        local who = room:get_occupant_by_nick(jid.bare(room.jid)..'/'..user_id);

        transcription.jid = who and who.jid;
        transcription.session_id = room._data.meetingId;

        local tenant, conference_name, id = extract_subdomain(jid.node(room.jid));
        if tenant then
            transcription.fqn = tenant..'/'..conference_name;
        else
            transcription.fqn = conference_name;
        end
        transcription.customer_id = id;

        return module:fire_event('jitsi-transcript-received', {
            room = room, occupant = occupant, transcription = transcription, stanza = stanza });
    end

    return module:fire_event('jitsi-endpoint-message-received', {
        room = room, occupant = occupant, message = msg_obj,
        origin = event.origin,
        stanza = stanza, raw_message = json_message });
end);
