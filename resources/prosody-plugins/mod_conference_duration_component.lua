local st = require "util.stanza";
local socket = require "socket";
local json = require "util.json";
local ext_events = module:require "ext_events";
local it = require "util.iterators";

-- we use async to detect Prosody 0.10 and earlier
local have_async = pcall(require, "util.async");
if not have_async then
    module:log("warn", "conference duration will not work with Prosody version 0.10 or less.");
    return;
end

local muc_component_host = module:get_option_string("muc_component");
if muc_component_host == nil then
    log("error", "No muc_component specified. No muc to operate on!");
    return;
end

log("info", "Starting conference duration timer for %s", muc_component_host);

function occupant_joined(event)
    local room = event.room;
    local occupant = event.occupant;

    local participant_count = it.count(room:each_occupant());

    if participant_count > 1 then

        if room.created_timestamp == nil then
            room.created_timestamp = os.time() * 1000; -- Lua provides UTC time in seconds, so convert to milliseconds
        end

        local body_json = {};
        body_json.type = 'conference_duration';
        body_json.created_timestamp = room.created_timestamp;

        local stanza = st.message({
            from = module.host;
            to = occupant.jid;
        })
        :tag("json-message", {xmlns='http://jitsi.org/jitmeet'})
        :text(json.encode(body_json)):up();

        room:route_stanza(stanza);
    end
end

-- executed on every host added internally in prosody, including components
function process_host(host)
    if host == muc_component_host then -- the conference muc component
        module:log("info", "Hook to muc events on %s", host);

       local muc_module = module:context(host)
       muc_module:hook("muc-occupant-joined", occupant_joined, -1);
    end
end

if prosody.hosts[muc_component_host] == nil then
    module:log("info", "No muc component found, will listen for it: %s", muc_component_host);

    -- when a host or component is added
    prosody.events.add_handler("host-activated", process_host);
else
    process_host(muc_component_host);
end
