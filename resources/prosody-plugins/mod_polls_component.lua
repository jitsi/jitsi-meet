local get_room_from_jid = module:require "util".get_room_from_jid;
local st = require "util.stanza";
local json = require "util.json";

local muc_component_host = module:get_option_string("muc_component");
if muc_component_host ~= nil then
    log("info", "Starting module %s", tostring(muc_component_host));
end

local muc_module = module:context("conference.jitsi.example.com");
if muc_module == nil then
    log("error", "No such muc found");
    return;
end

function on_message(event)
    log("debug", "Recieved Message %s", tostring(event.stanza));

    if event.stanza.attr.type == "error" then
        return;
    end

    local polls = event.stanza:get_child('polls', 'http://jitsi.org/jitmeet');

    if polls then
        local roomAddress = polls.attr.room;
        local room = get_room_from_jid(roomAddress);

        if not room then
            log("warn", "No room found %s", roomAddress);
            return false;
        end

        log("info", "%s", tostring(polls.attr.poll));

        if polls.attr.poll then
            room.poll = polls.attr.poll;

            log("info", "Saved current poll in room %s", room.jid);
        else
            room.poll = nil

            log("info", "Removed current poll from room %s", room.jid);
        end

        return true;
    else
        return false;
    end
end

function on_occupant_joined(event)
    local room = event.room;
    local occupant = event.occupant;
    
    if room.poll then
        log("info", "Informed occupant %s about poll %s", tostring(occupant.jid), room.poll);

        local body_json = {};
        body_json.type = "polls";
        body_json.poll = room.poll;

        local stanza = st.message({
            from = module.host;
            to = occupant.jid;
        })
        :tag("json-message", {xmlns='http://jitsi.org/jitmeet'})
        :text(json.encode(body_json)):up();

        room:route_stanza(stanza);
    end
end

function on_room_created(event)
    log("info", "room created");

    local room = event.room;
    room.poll = nil;
end

module:hook("message/host", on_message);
muc_module:hook("muc-room-created", on_room_created, -1);
muc_module:hook("muc-occupant-joined", on_occupant_joined, -1);
