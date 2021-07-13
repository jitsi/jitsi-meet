local get_room_from_jid = module:require "util".get_room_from_jid;
local room_jid_match_rewrite = module:require "util".room_jid_match_rewrite;
local is_healthcheck_room = module:require "util".is_healthcheck_room;
local jid_resource = require "util.jid".resource;
local ext_events = module:require "ext_events"
local st = require "util.stanza";
local socket = require "socket";
local json = require "util.json";
local um_is_admin = require "core.usermanager".is_admin;

-- we use async to detect Prosody 0.10 and earlier
local have_async = pcall(require, "util.async");
if not have_async then
    module:log("warn", "speaker stats will not work with Prosody version 0.10 or less.");
    return;
end

local muc_component_host = module:get_option_string("muc_component");
if muc_component_host == nil then
    log("error", "No muc_component specified. No muc to operate on!");
    return;
end

log("info", "Starting speakerstats for %s", muc_component_host);

local function is_admin(jid)
    return um_is_admin(jid, module.host);
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
        local room = get_room_from_jid(room_jid_match_rewrite(roomAddress));

        if not room then
            log("warn", "No room found %s", roomAddress);
            return false;
        end
 
        if not room.speakerStats then
            log("warn", "No speakerStats found for %s", roomAddress);
            return false;
        end

        local roomSpeakerStats = room.speakerStats;
        local from = event.stanza.attr.from;

        local occupant = room:get_occupant_by_real_jid(from);
        if not occupant then
            log("warn", "No occupant %s found for %s", from, roomAddress);
            return false;
        end

        local newDominantSpeaker = roomSpeakerStats[occupant.jid];
        local oldDominantSpeakerId = roomSpeakerStats['dominantSpeakerId'];

        if oldDominantSpeakerId then
            local oldDominantSpeaker = roomSpeakerStats[oldDominantSpeakerId];
            if oldDominantSpeaker then
                oldDominantSpeaker:setDominantSpeaker(false);
            end
        end

        if newDominantSpeaker then
            newDominantSpeaker:setDominantSpeaker(true);
        end

        room.speakerStats['dominantSpeakerId'] = occupant.jid;
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
        nick = nick;
        context_user = context_user;
        displayName = nil;
    }, SpeakerStats);
end

-- Changes the dominantSpeaker data for current occupant
-- saves start time if it is new dominat speaker
-- or calculates and accumulates time of speaking
function SpeakerStats:setDominantSpeaker(isNowDominantSpeaker)
    -- log("debug", "set isDominant %s for %s", tostring(isNowDominantSpeaker), self.nick);

    if not self:isDominantSpeaker() and isNowDominantSpeaker then
        self._dominantSpeakerStart = socket.gettime()*1000;
    elseif self:isDominantSpeaker() and not isNowDominantSpeaker then
        local now = socket.gettime()*1000;
        local timeElapsed = math.floor(now - self._dominantSpeakerStart);

        self.totalDominantSpeakerTime
            = self.totalDominantSpeakerTime + timeElapsed;
        self._dominantSpeakerStart = 0;
    end
end

-- Returns true if the tracked user is currently a dominant speaker.
function SpeakerStats:isDominantSpeaker()
    return self._dominantSpeakerStart > 0;
end
--- End SpeakerStats

-- create speakerStats for the room
function room_created(event)
    local room = event.room;

    if is_healthcheck_room(room.jid) then
        return;
    end

    room.speakerStats = {};
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
                if values.nick ~= nil and values.nick ~= 'focus' then
                    local totalDominantSpeakerTime = values.totalDominantSpeakerTime;
                    if totalDominantSpeakerTime > 0 or room:get_occupant_jid(jid) == nil then
                        -- before sending we need to calculate current dominant speaker state
                        if values:isDominantSpeaker() then
                            local timeElapsed = math.floor(socket.gettime()*1000 - values._dominantSpeakerStart);
                            totalDominantSpeakerTime = totalDominantSpeakerTime + timeElapsed;
                        end

                        users_json[values.nick] =  {
                            displayName = values.displayName,
                            totalDominantSpeakerTime = totalDominantSpeakerTime
                        };
                    end
                end
            end

            if next(users_json) == nil then
                return;
            end

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
        speakerStatsForOccupant:setDominantSpeaker(false);

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

-- executed on every host added internally in prosody, including components
function process_host(host)
    if host == muc_component_host then -- the conference muc component
        module:log("info","Hook to muc events on %s", host);

        local muc_module = module:context(host);
        muc_module:hook("muc-room-created", room_created, -1);
        muc_module:hook("muc-occupant-joined", occupant_joined, -1);
        muc_module:hook("muc-occupant-pre-leave", occupant_leaving, -1);
        muc_module:hook("muc-room-destroyed", room_destroyed, -1);
    end
end

if prosody.hosts[muc_component_host] == nil then
    module:log("info","No muc component found, will listen for it: %s", muc_component_host)

    -- when a host or component is added
    prosody.events.add_handler("host-activated", process_host);
else
    process_host(muc_component_host);
end
