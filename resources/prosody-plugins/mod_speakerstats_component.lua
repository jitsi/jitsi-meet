local get_room_from_jid = module:require "util".get_room_from_jid;
local room_jid_match_rewrite = module:require "util".room_jid_match_rewrite;
local is_healthcheck_room = module:require "util".is_healthcheck_room;
local jid_resource = require "util.jid".resource;
local ext_events = module:require "ext_events"
local st = require "util.stanza";
local socket = require "socket";
local json = require "util.json";
local um_is_admin = require "core.usermanager".is_admin;
local jid_split = require 'util.jid'.split;

-- we use async to detect Prosody 0.10 and earlier
local have_async = pcall(require, "util.async");
if not have_async then
    module:log("warn", "speaker stats will not work with Prosody version 0.10 or less.");
    return;
end

local muc_component_host = module:get_option_string("muc_component");
local muc_domain_base = module:get_option_string("muc_mapper_domain_base");

if muc_component_host == nil or muc_domain_base == nil then
    module:log("error", "No muc_component specified. No muc to operate on!");
    return;
end
local breakout_room_component_host = "breakout." .. muc_domain_base;

module:log("info", "Starting speakerstats for %s", muc_component_host);

local main_muc_service;

local function is_admin(jid)
    return um_is_admin(jid, module.host);
end

-- Searches all rooms in the main muc component that holds a breakout room
-- caches it if found so we don't search it again
-- we should not cache objects in _data as this is being serialized when calling room:save()
local function get_main_room(breakout_room)
    if breakout_room.main_room then
        return breakout_room.main_room;
    end

    -- let's search all rooms to find the main room
    for room in main_muc_service.each_room() do
        if room._data and room._data.breakout_rooms_active and room._data.breakout_rooms[breakout_room.jid] then
            breakout_room.main_room = room;
            return room;
        end
    end
end

-- receives messages from client currently connected to the room
-- clients indicates their own dominant speaker events
function on_message(event)
    -- Check the type of the incoming stanza to avoid loops:
    if event.stanza.attr.type == "error" then
        return; -- We do not want to reply to these, so leave.
    end

    local speakerStats
        = event.stanza:get_child('speakerstats', 'http://jitsi.org/jitmeet');
    if speakerStats then
        local roomAddress = speakerStats.attr.room;
        local silence = speakerStats.attr.silence == 'true';
        local room = get_room_from_jid(room_jid_match_rewrite(roomAddress));

        if not room then
            module:log("warn", "No room found %s", roomAddress);
            return false;
        end

        if not room.speakerStats then
            module:log("warn", "No speakerStats found for %s", roomAddress);
            return false;
        end

        local roomSpeakerStats = room.speakerStats;
        local from = event.stanza.attr.from;

        local occupant = room:get_occupant_by_real_jid(from);
        if not occupant then
            module:log("warn", "No occupant %s found for %s", from, roomAddress);
            return false;
        end

        local newDominantSpeaker = roomSpeakerStats[occupant.jid];
        local oldDominantSpeakerId = roomSpeakerStats['dominantSpeakerId'];

        if oldDominantSpeakerId and occupant.jid ~= oldDominantSpeakerId then
            local oldDominantSpeaker = roomSpeakerStats[oldDominantSpeakerId];
            if oldDominantSpeaker then
                oldDominantSpeaker:setDominantSpeaker(false, false);
            end
        end

        if newDominantSpeaker then
            newDominantSpeaker:setDominantSpeaker(true, silence);
        end

        room.speakerStats['dominantSpeakerId'] = occupant.jid;
    end

    local newFaceLandmarks = event.stanza:get_child('faceLandmarks', 'http://jitsi.org/jitmeet');

    if newFaceLandmarks then
        local roomAddress = newFaceLandmarks.attr.room;
        local room = get_room_from_jid(room_jid_match_rewrite(roomAddress));

        if not room then
            module:log("warn", "No room found %s", roomAddress);
            return false;
        end
         if not room.speakerStats then
            module:log("warn", "No speakerStats found for %s", roomAddress);
            return false;
        end
        local from = event.stanza.attr.from;

        local occupant = room:get_occupant_by_real_jid(from);
        if not occupant or not room.speakerStats[occupant.jid] then
            module:log("warn", "No occupant %s found for %s", from, roomAddress);
            return false;
        end
        local faceLandmarks = room.speakerStats[occupant.jid].faceLandmarks;
        table.insert(faceLandmarks,
            {
                faceExpression = newFaceLandmarks.attr.faceExpression,
                timestamp = tonumber(newFaceLandmarks.attr.timestamp),
                duration = tonumber(newFaceLandmarks.attr.duration),
            })
    end

    return true
end

--- Start SpeakerStats implementation
local SpeakerStats = {};
SpeakerStats.__index = SpeakerStats;

function new_SpeakerStats(nick, context_user)
    return setmetatable({
        totalDominantSpeakerTime = 0;
        _dominantSpeakerStart = 0;
        _isSilent = false;
        _isDominantSpeaker = false;
        nick = nick;
        context_user = context_user;
        displayName = nil;
        faceLandmarks = {};
    }, SpeakerStats);
end

-- Changes the dominantSpeaker data for current occupant
-- saves start time if it is new dominat speaker
-- or calculates and accumulates time of speaking
function SpeakerStats:setDominantSpeaker(isNowDominantSpeaker, silence)
    -- module:log("debug", "set isDominant %s for %s", tostring(isNowDominantSpeaker), self.nick);

    local now = socket.gettime()*1000;

    if not self:isDominantSpeaker() and isNowDominantSpeaker and not silence then
        self._dominantSpeakerStart = now;
    elseif self:isDominantSpeaker() then
        if not isNowDominantSpeaker then
            if not self._isSilent then
                local timeElapsed = math.floor(now - self._dominantSpeakerStart);

                self.totalDominantSpeakerTime = self.totalDominantSpeakerTime + timeElapsed;
                self._dominantSpeakerStart = 0;
            end
        elseif self._isSilent and not silence then
            self._dominantSpeakerStart = now;
        elseif not self._isSilent and silence then
            local timeElapsed = math.floor(now - self._dominantSpeakerStart);

            self.totalDominantSpeakerTime = self.totalDominantSpeakerTime + timeElapsed;
            self._dominantSpeakerStart = 0;
        end
    end

    self._isDominantSpeaker = isNowDominantSpeaker;
    self._isSilent = silence;
end

-- Returns true if the tracked user is currently a dominant speaker.
function SpeakerStats:isDominantSpeaker()
    return self._isDominantSpeaker;
end

 -- Returns true if the tracked user is currently silent.
function SpeakerStats:isSilent()
    return self._isSilent;
end
--- End SpeakerStats

-- create speakerStats for the room
function room_created(event)
    local room = event.room;

    if is_healthcheck_room(room.jid) then
        return ;
    end
    room.speakerStats = {};
    room.speakerStats.sessionId = room._data.meetingId;
end

-- create speakerStats for the breakout
function breakout_room_created(event)
    local room = event.room;
    if is_healthcheck_room(room.jid) then
        return ;
    end
    local main_room = get_main_room(room);
    room.speakerStats = {};
    room.speakerStats.isBreakout = true
    room.speakerStats.breakoutRoomId = jid_split(room.jid)
    room.speakerStats.sessionId = main_room._data.meetingId;
end

-- Create SpeakerStats object for the joined user
function occupant_joined(event)
    local occupant, room = event.occupant, event.room;

    if is_healthcheck_room(room.jid) or is_admin(occupant.bare_jid) then
        return;
    end

    local occupant = event.occupant;

    local nick = jid_resource(occupant.nick);

    if room.speakerStats then
        -- lets send the current speaker stats to that user, so he can update
        -- its local stats
        if next(room.speakerStats) ~= nil then
            local users_json = {};
            for jid, values in pairs(room.speakerStats) do
                -- skip reporting those without a nick('dominantSpeakerId')
                -- and skip focus if sneaked into the table
                if values and type(values) == 'table' and values.nick ~= nil and values.nick ~= 'focus' then
                    local totalDominantSpeakerTime = values.totalDominantSpeakerTime;
                    local faceLandmarks = values.faceLandmarks;
                    if totalDominantSpeakerTime > 0 or room:get_occupant_jid(jid) == nil or values:isDominantSpeaker()
                        or next(faceLandmarks) ~= nil then
                        -- before sending we need to calculate current dominant speaker state
                        if values:isDominantSpeaker() and not values:isSilent() then
                            local timeElapsed = math.floor(socket.gettime()*1000 - values._dominantSpeakerStart);
                            totalDominantSpeakerTime = totalDominantSpeakerTime + timeElapsed;
                        end

                        users_json[values.nick] =  {
                            displayName = values.displayName,
                            totalDominantSpeakerTime = totalDominantSpeakerTime,
                            faceLandmarks = faceLandmarks
                        };
                    end
                end
            end

            if next(users_json) ~= nil then
                local body_json = {};
                body_json.type = 'speakerstats';
                body_json.users = users_json;

                local stanza = st.message({
                    from = module.host;
                    to = occupant.jid; })
                :tag("json-message", {xmlns='http://jitsi.org/jitmeet'})
                :text(json.encode(body_json)):up();

                room:route_stanza(stanza);
            end
        end

        local context_user = event.origin and event.origin.jitsi_meet_context_user or nil;
        room.speakerStats[occupant.jid] = new_SpeakerStats(nick, context_user);
    end
end

-- Occupant left set its dominant speaker to false and update the store the
-- display name
function occupant_leaving(event)
    local room = event.room;

    if is_healthcheck_room(room.jid) then
        return;
    end

    if not room.speakerStats then
        return;
    end

    local occupant = event.occupant;

    local speakerStatsForOccupant = room.speakerStats[occupant.jid];
    if speakerStatsForOccupant then
        speakerStatsForOccupant:setDominantSpeaker(false, false);

        -- set display name
        local displayName = occupant:get_presence():get_child_text(
            'nick', 'http://jabber.org/protocol/nick');
        speakerStatsForOccupant.displayName = displayName;
    end
end

-- Conference ended, send speaker stats
function room_destroyed(event)
    local room = event.room;

    if is_healthcheck_room(room.jid) then
        return;
    end

    ext_events.speaker_stats(room, room.speakerStats);
end

module:hook("message/host", on_message);

function process_main_muc_loaded(main_muc, host_module)
    -- the conference muc component
    module:log("info", "Hook to muc events on %s", host_module);
    main_muc_service = main_muc;
    module:log("info", "Main muc service %s", main_muc_service)
    host_module:hook("muc-room-created", room_created, -1);
    host_module:hook("muc-occupant-joined", occupant_joined, -1);
    host_module:hook("muc-occupant-pre-leave", occupant_leaving, -1);
    host_module:hook("muc-room-destroyed", room_destroyed, -1);
end

function process_breakout_muc_loaded(breakout_muc, host_module)
    -- the Breakout muc component
    module:log("info", "Hook to muc events on %s", host_module);
    host_module:hook("muc-room-created", breakout_room_created, -1);
    host_module:hook("muc-occupant-joined", occupant_joined, -1);
    host_module:hook("muc-occupant-pre-leave", occupant_leaving, -1);
    host_module:hook("muc-room-destroyed", room_destroyed, -1);
end

-- process a host module directly if loaded or hooks to wait for its load
function process_host_module(name, callback)
    local function process_host(host)
        if host == name then
            callback(module:context(host), host);
        end
    end

    if prosody.hosts[name] == nil then
        module:log('debug', 'No host/component found, will wait for it: %s', name)

        -- when a host or component is added
        prosody.events.add_handler('host-activated', process_host);
    else
        process_host(name);
    end
end

-- process or waits to process the conference muc component
process_host_module(muc_component_host, function(host_module, host)
    module:log('info', 'Conference component loaded %s', host);

    local muc_module = prosody.hosts[host].modules.muc;
    if muc_module then
        process_main_muc_loaded(muc_module, host_module);
    else
        module:log('debug', 'Will wait for muc to be available');
        prosody.hosts[host].events.add_handler('module-loaded', function(event)
            if (event.module == 'muc') then
                process_main_muc_loaded(prosody.hosts[host].modules.muc, host_module);
            end
        end);
    end
end);

-- process or waits to process the breakout rooms muc component
process_host_module(breakout_room_component_host, function(host_module, host)
    module:log('info', 'Breakout component loaded %s', host);

    local muc_module = prosody.hosts[host].modules.muc;
    if muc_module then
        process_breakout_muc_loaded(muc_module, host_module);
    else
        module:log('debug', 'Will wait for muc to be available');
        prosody.hosts[host].events.add_handler('module-loaded', function(event)
            if (event.module == 'muc') then
                process_breakout_muc_loaded(prosody.hosts[host].modules.muc, host_module);
            end
        end);
    end
end);
