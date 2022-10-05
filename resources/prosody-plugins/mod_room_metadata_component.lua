-- This module implements a generic metadata storage system for rooms.
--
-- VirtualHost "jitmeet.example.com"
--     modules_enabled = {
--         "room_metadata"
--     }
--     room_metadata_component = "metadata.jitmeet.example.com"
--     main_muc = "conference.jitmeet.example.com"
--
-- Component "metadata.jitmeet.example.com" "room_metadata_component"
--      muc_component = "conference.jitmeet.example.com"
--      breakout_rooms_component = "breakout.jitmeet.example.com"

local jid_node = require 'util.jid'.node;
local json = require 'util.json';
local st = require 'util.stanza';

local util = module:require 'util';
local is_healthcheck_room = util.is_healthcheck_room;
local get_room_from_jid = util.get_room_from_jid;
local room_jid_match_rewrite = util.room_jid_match_rewrite;

local COMPONENT_IDENTITY_TYPE = 'room_metadata';
local FORM_KEY = 'muc#roominfo_jitsimetadata';

local muc_component_host = module:get_option_string('muc_component');

if muc_component_host == nil then
    module:log("error", "No muc_component specified. No muc to operate on!");
    return;
end

local breakout_rooms_component_host = module:get_option_string('breakout_rooms_component');

module:log("info", "Starting room metadata for %s", muc_component_host);


-- Utility functions

function getMetadataJSON(room)
    return json.encode({
        type = COMPONENT_IDENTITY_TYPE,
        metadata = room.jitsiMetadata or {}
    });
end

-- Putting the information on the config form / disco-info allows us to save
-- an extra message to users who join later.
function getFormData(room)
    return {
        name = FORM_KEY;
        type = 'text-multi';
        label = 'Room metadata';
        value = getMetadataJSON(room);
    };
end

function broadcastMetadata(room)
    local json_msg = getMetadataJSON(room);

    for _, occupant in room:each_occupant() do
        if jid_node(occupant.jid) ~= 'focus' then
            send_json_msg(occupant.jid, json_msg)
        end
    end
end

function send_json_msg(to_jid, json_msg)
    local stanza = st.message({ from = module.host; to = to_jid; })
         :tag('json-message', { xmlns = 'http://jitsi.org/jitmeet' }):text(json_msg):up();
    module:send(stanza);
end

-- Handling events

function room_created(event)
    local room = event.room;

    if is_healthcheck_room(room.jid) then
        return ;
    end

    room.jitsiMetadata = {};
end

function on_message(event)
    local session = event.origin;

    -- Check the type of the incoming stanza to avoid loops:
    if event.stanza.attr.type == 'error' then
        return; -- We do not want to reply to these, so leave.
    end

    if not session or not session.jitsi_web_query_room then
        return false;
    end

    local message = event.stanza:get_child(COMPONENT_IDENTITY_TYPE, 'http://jitsi.org/jitmeet');
    local messageText = message:get_text();

    if not message or not messageText then
        return false;
    end

    local roomJid = message.attr.room;
    local room = get_room_from_jid(room_jid_match_rewrite(roomJid));

    if not room then
        module:log('warn', 'No room found found for %s/%s',
                session.jitsi_web_query_prefix, session.jitsi_web_query_room);
        return false;
    end

    -- check that the participant requesting is a moderator and is an occupant in the room
    local from = event.stanza.attr.from;
    local occupant = room:get_occupant_by_real_jid(from);

    if not occupant then
        module:log('warn', 'No occupant %s found for %s', from, room.jid);
        return false;
    end

    if occupant.role ~= 'moderator' then
        module:log('warn', 'Occupant %s is not moderator and not allowed this operation for %s', from, room.jid);
        return false;
    end

    local jsonData = json.decode(messageText);
    if jsonData == nil then -- invalid JSON
        module:log("error", "Invalid JSON message: %s", messageText);
        return false;
    end

    if jsonData.key == nil or jsonData.data == nil then
        module:log("error", "Invalid JSON payload, key or data are missing: %s", messageText);
        return false;
    end

    room.jitsiMetadata[jsonData.key] = jsonData.data;

    broadcastMetadata(room);

    return true;
end

-- Module operations

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

-- handle messages to this component
module:hook("message/host", on_message);

-- operates on already loaded main muc module
function process_main_muc_loaded(main_muc, host_module)
    module:log('debug', 'Main muc loaded');
    module:log("info", "Hook to muc events on %s", muc_component_host);

    host_module:hook("muc-room-created", room_created, -1);

    host_module:hook('muc-disco#info', function (event)
        local room = event.room;

        table.insert(event.form, getFormData(room));
    end);

    host_module:hook("muc-config-form", function(event)
        local room = event.room;

        table.insert(event.form, getFormData(room));
    end);
end

-- process or waits to process the main muc component
process_host_module(muc_component_host, function(host_module, host)
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

-- breakout rooms support
function process_breakout_muc_loaded(breakout_muc, host_module)
    module:log('debug', 'Breakout rooms muc loaded');
    module:log("info", "Hook to muc events on %s", breakout_rooms_component_host);

    host_module:hook("muc-room-created", room_created, -1);

    host_module:hook('muc-disco#info', function (event)
        local room = event.room;

        table.insert(event.form, getFormData(room));
    end);

    host_module:hook("muc-config-form", function(event)
        local room = event.room;

        table.insert(event.form, getFormData(room));
    end);
end

if breakout_rooms_component_host then
    process_host_module(breakout_rooms_component_host, function(host_module, host)
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
end
