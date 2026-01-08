-- DEPRECATED and will be removed, giving time for mobile clients to update
local st = require "util.stanza";
local socket = require "socket";
local json = require 'cjson.safe';
local it = require "util.iterators";
local process_host_module = module:require "util".process_host_module;

-- we use async to detect Prosody 0.10 and earlier
local have_async = pcall(require, "util.async");
if not have_async then
    module:log("warn", "conference duration will not work with Prosody version 0.10 or less.");
    return;
end

local muc_component_host = module:get_option_string("muc_component");
if muc_component_host == nil then
    module:log("error", "No muc_component specified. No muc to operate on!");
    return;
end

module:log("info", "Starting conference duration timer for %s", muc_component_host);

function occupant_joined(event)
    local room = event.room;
    local occupant = event.occupant;

    local participant_count = it.count(room:each_occupant());

    if participant_count > 1 then
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

process_host_module(muc_component_host, function(host_module, host)
    host_module:hook("muc-occupant-joined", occupant_joined, -1);
end);
