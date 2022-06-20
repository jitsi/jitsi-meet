local json = require "util.json";
local http = require "net.http";

-- invite will perform the trigger for external call invites.
-- This trigger is left unimplemented. The implementation is expected
-- to be specific to the deployment.
local function invite(stanza, url, call_id)
    module:log(
        "warn",
        "A module has been configured that triggers external events."
    )
    module:log("warn", "Implement this lib to trigger external events.")
end

-- cancel will perform the trigger for external call cancellation.
-- This trigger is left unimplemented. The implementation is expected
-- to be specific to the deployment.
local function cancel(stanza, url, reason, call_id)
    module:log(
        "warn",
        "A module has been configured that triggers external events."
    )
    module:log("warn", "Implement this lib to trigger external events.")
end

-- missed will perform the trigger for external call missed notification.
-- This trigger is left unimplemented. The implementation is expected
-- to be specific to the deployment.
local function missed(stanza, call_id)
    module:log(
        "warn",
        "A module has been configured that triggers external events."
    )
    module:log("warn", "Implement this lib to trigger external events.")
end

-- Event that speaker stats for a conference are available
-- this is a table where key is the jid and the value is a table:
--{
--  totalDominantSpeakerTime
--  nick
--  displayName
--}
-- This trigger is left unimplemented. The implementation is expected
-- to be specific to the deployment.
local function speaker_stats(room, speakerStats, requestURL)
    local http_headers = {
        ["User-Agent"] = "Prosody ("..prosody.version.."; "..prosody.platform..")",
        ["Content-Type"] = "application/json"
    };
    
    local roomSpeakerStats = {};
    roomSpeakerStats['roomjid'] = room.jid;
    roomSpeakerStats['meetingId'] = room._data.meetingId;
    roomSpeakerStats['dominantSpeakerId'] = speakerStats.dominantSpeakerId;

    local participantSpeakerStats = {};
    for jid, values in pairs(speakerStats) do
        -- skip reporting those without a nick('dominantSpeakerId')
        -- and skip focus if sneaked into the table
        if values.nick ~= nil and values.nick ~= 'focus' then
            local resultSpeakerStats = {};
            
            resultSpeakerStats['jid'] = jid;
            resultSpeakerStats['nick'] = values.nick;
            resultSpeakerStats['displayName'] = values.displayName;
            resultSpeakerStats['totalDominantSpeakerTime'] = values.totalDominantSpeakerTime;

            table.insert(participantSpeakerStats, resultSpeakerStats);
        end
    end

    roomSpeakerStats.speakerStats = participantSpeakerStats;
    module:log("info", "Room speaker stats", json.encode(roomSpeakerStats));
    
    if requestURL ~= nil then
        local request = http.request(requestURL, {
            headers = http_headers,
            method = "POST",
            body = json.encode(roomSpeakerStats)
        }, function (content_, code_, response_, request_)
            if code_ == 200 then
                module:log("debug", "SUCCESS Speaker Stats Posted");
            else
                module:log("warn", "ERROR Posting Speaker Stats");
            end
        end);
    end
end

local ext_events = {
    missed = missed,
    invite = invite,
    cancel = cancel,
    speaker_stats = speaker_stats
}

return ext_events
