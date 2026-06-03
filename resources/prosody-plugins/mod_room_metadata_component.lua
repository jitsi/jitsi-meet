-- mod_room_metadata_component.lua
--
-- Prosody component that provides a generic key-value metadata store for MUC
-- rooms. Metadata is held in room.jitsiMetadata (a Lua table) and broadcast
-- to all occupants as a JSON <json-message> stanza whenever it changes.
--
-- ── Metadata updates (client → component) ────────────────────────────────────
-- Clients send a <message> to this component containing a <room_metadata
-- xmlns='http://jitsi.org/jitmeet'> child whose text is JSON:
--
--   { "key": "<field-name>", "data": <any JSON value> }
--
-- Authorization is a three-step process (on_message):
--  1. The sender must be an occupant of the room identified by the session's
--     jitsi_web_query_room field (set from the WebSocket ?room= URL param).
--  2. The 'jitsi-metadata-allow-moderation' event is fired on the main virtual
--     host so that other modules can override the default access rules:
--       · returns false   → deny the update unconditionally
--       · returns non-nil → allow the update and use the returned value as data
--       · returns nil     → fall through to the default moderator-only check
--  3. Default: the occupant must have role='moderator'.
--
-- If authorized and the value changed, room.jitsiMetadata[key] is updated and
-- the full metadata table is broadcast to every occupant. A
-- 'jitsi-metadata-updated' event is also fired on the main MUC module so that
-- other modules can react to specific key changes.
--
-- ── Metadata delivery (component → client) ────────────────────────────────────
-- Initial delivery: a stanza filter intercepts the self-presence (status 110)
-- about to be sent to a newly-joining occupant and, before it goes out, pushes
-- the current metadata to that client. TURN credentials (from external_services)
-- are included in this initial push. room.sent_initial_metadata[bare_jid] is
-- set to prevent double-delivery on admin reconnects.
--
-- Broadcast: broadcastMetadata() / send_metadata() send a <json-message> to
-- every occupant. Admins (jicofo) additionally receive the room's participant
-- and moderator lists from room._data. Transcription HTTP headers in the
-- metadata are redacted from log output but sent in full to clients.
--
-- ── Internal metadata changes ─────────────────────────────────────────────────
-- Other modules update room.jitsiMetadata directly and then fire
-- 'room-metadata-changed' on the MUC host to trigger a broadcast.
--
-- ── Legacy startMuted shim ────────────────────────────────────────────────────
-- When a moderator sends a presence containing <startmuted> (old client API),
-- the values are copied into room.jitsiMetadata.startMuted and a
-- 'room-metadata-changed' broadcast is triggered. This preserves backward
-- compatibility until all clients switch to the metadata API.
--
-- ── TURN / extdisco gating (optional) ────────────────────────────────────────
-- When extdisco_occpuant_check=true, extdisco IQ-get requests are intercepted
-- at priority 100 so that only room occupants can obtain TURN credentials.
--
-- Component "metadata.jitmeet.example.com" "room_metadata_component"
--      muc_component = "conference.jitmeet.example.com"
--      breakout_rooms_component = "breakout.jitmeet.example.com"
local array = require 'util.array';
local filters = require 'util.filters';
local jid_node = require 'util.jid'.node;
local json = require 'util.json';
local st = require 'util.stanza';
local jid = require 'util.jid';

local util = module:require 'util';
local is_admin = util.is_admin;
local is_healthcheck_room = util.is_healthcheck_room;
local get_room_from_jid = util.get_room_from_jid;
local room_jid_match_rewrite = util.room_jid_match_rewrite;
local internal_room_jid_match_rewrite = util.internal_room_jid_match_rewrite;
local process_host_module = util.process_host_module;
local table_shallow_copy = util.table_shallow_copy;
local table_add = util.table_add;
local table_equals = util.table_equals;
local get_room_by_name_and_subdomain = util.get_room_by_name_and_subdomain;
local get_occupant_by_real_jid = util.get_occupant_by_real_jid;

local dt = require "prosody.util.datetime";
local ext_services = module:depends("external_services");
local get_services = ext_services.get_services;

local MUC_NS = 'http://jabber.org/protocol/muc';
local COMPONENT_IDENTITY_TYPE = 'room_metadata';
local FORM_KEY = 'muc#roominfo_jitsimetadata';

local muc_component_host = module:get_option_string('muc_component');

if muc_component_host == nil then
    module:log('error', 'No muc_component specified. No muc to operate on!');
    return;
end

local main_virtual_host = module:get_option_string('muc_mapper_domain_base');
if not main_virtual_host then
    module:log('warn', 'No muc_mapper_domain_base option set.');
    return;
end

local breakout_rooms_component_host = module:get_option_string('breakout_rooms_component');
-- TODO: flip default once mobile clients update to latest ljm that supports transition of turn data in metadata
local extdisco_occpuant_check = module:get_option_boolean('extdisco_occpuant_check', false);

-- Keys that clients (including moderators) are not allowed to set via the
-- metadata message API. These are either server-controlled fields or keys whose
-- values are assembled and injected by the server at broadcast time.
local blocked_metadata_keys = module:get_option_set('room_metadata_blocked_keys', {
    'allownersEnabled',
    'asyncTranscription',
    'conferencePresetsServiceEnabled',
    'dialinEnabled',
    'moderators',
    'participants',
    'participantsSoftLimit',
    'services',
    'transcriberType',
    'transcription',
    'visitorsEnabled',
});

module:log("info", "Starting room metadata for %s", muc_component_host);

local main_muc_module;

-- Utility functions

-- Returns json string with the metadata for the room.
-- @param room The room object.
-- @param metadata Optional metadata to use instead of the room's jitsiMetadata.
function getMetadataJSON(room, metadata)
    local res, error = json.encode({
        type = COMPONENT_IDENTITY_TYPE,
        metadata = metadata or room.jitsiMetadata or {}
    });

    if not res then
        module:log('error', 'Error encoding data room:%s', room.jid, error);
    end

    return res;
end

function broadcastMetadata(room, json_msg)
    if not json_msg then
        return;
    end

    for _, occupant in room:each_occupant() do
        send_metadata(occupant, room, json_msg)
    end
end

function send_metadata(occupant, room, json_msg, include_services)
    if not json_msg or is_admin(occupant.bare_jid) then
        local metadata_to_send = table_shallow_copy(room.jitsiMetadata) or {};

        -- we want to send the main meeting participants only to jicofo
        if is_admin(occupant.bare_jid) then
            local participants;
            local moderators = array();

            if room._data.participants then
                participants = array();
                participants:append(room._data.participants);
            end

            if room._data.moderators then
                moderators:append(room._data.moderators);
            end

            metadata_to_send.participants = participants;
            metadata_to_send.moderators = moderators;

            module:log('info', 'Sending metadata to jicofo room=%s,meeting_id=%s', room.jid, room._data.meetingId);
        elseif include_services then
            metadata_to_send.services = {};

            for _, srv in ipairs(get_services()) do
                table.insert(metadata_to_send.services, {
                    type = srv.type;
                    transport = srv.transport;
                    host = srv.host;
                    port = srv.port and string.format('%d', srv.port) or nil;
                    username = srv.username;
                    password = srv.password;
                    expires = srv.expires and dt.datetime(srv.expires) or nil;
                    restricted = srv.restricted and '1' or nil;
                });
            end
        end

        json_msg = getMetadataJSON(room, metadata_to_send);
    end

    local stanza = st.message({ from = module.host; to = occupant.jid; })
         :tag('json-message', {
             xmlns = 'http://jitsi.org/jitmeet',
             room = internal_room_jid_match_rewrite(room.jid)
         }):text(json_msg):up();
    module:send(stanza);
end

-- Handling events

function room_created(event)
    local room = event.room;

    if is_healthcheck_room(room.jid) then
        return;
    end

    if not room.jitsiMetadata then
        room.jitsiMetadata = {};
    end

    room.sent_initial_metadata = {};
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
    if not message then
        return true;
    end

    local messageText = message:get_text();
    if not messageText or messageText == '' then
        return true;
    end

    local roomJid = message.attr.room;
    if not roomJid then
        return true;
    end

    local room = get_room_from_jid(room_jid_match_rewrite(roomJid));

    if not room then
        module:log('warn', 'No room found for %s/%s',
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

    local jsonData, error = json.decode(messageText);
    if jsonData == nil then -- invalid JSON
        module:log("error", "Invalid JSON message: %s error:%s", messageText, error);
        return false;
    end

    if type(jsonData.key) ~= 'string' then
        module:log('error', 'Invalid JSON payload, key is not a string: %s', messageText);
        return true;
    end

    if jsonData.key == nil or jsonData.data == nil or jsonData.data == json.null then
        module:log("error", "Invalid JSON payload, key or data are missing: %s", messageText);
        return false;
    end

    -- Fire 'jitsi-metadata-allow-moderation' so other modules can override the
    -- default moderator-only access control on a per-key basis.
    --   false    → deny the update unconditionally (e.g. key restricted to server)
    --   non-nil  → allow the update; the returned value replaces jsonData.data
    --              (lets a hook sanitise or filter the payload before it is stored)
    --   nil      → no opinion; fall through to the default moderator-only check
    local res = module:context(main_virtual_host):fire_event('jitsi-metadata-allow-moderation',
            { room = room; actor = occupant; key = jsonData.key ; data = jsonData.data; session = session; });

    if res == false then
        module:log('warn', 'Occupant %s features do not allow this operation(%s) for %s', from, jsonData.key, room.jid);
        return false;
    elseif res ~= nil then
        jsonData.data = res;
    else
        if occupant.role ~= 'moderator' then
            module:log('warn', 'Occupant %s is not moderator and not allowed this operation(%s) for %s',
                from, jsonData.key, room.jid);
            return false;
        end
    end

    if blocked_metadata_keys:contains(jsonData.key) then
        module:log('warn', 'Occupant %s attempted to set blocked metadata key "%s" in room:%s',
            from, jsonData.key, room.jid);
        return false;
    end

    local old_value = room.jitsiMetadata[jsonData.key];
    if not table_equals(old_value, jsonData.data) then
        room.jitsiMetadata[jsonData.key] = jsonData.data;

        module:log('info', 'Metadata key "%s" updated by %s in room:%s,meeting_id:%s', jsonData.key, from, room.jid, room._data.meetingId);
        broadcastMetadata(room, getMetadataJSON(room));

        -- fire and event for the change
        main_muc_module:fire_event('jitsi-metadata-updated', { room = room; actor = occupant; key = jsonData.key; });
    end

    return true;
end

-- Module operations

-- handle messages to this component
module:hook("message/host", on_message);

-- operates on already loaded main muc module
function process_main_muc_loaded(main_muc, host_module)
    main_muc_module = host_module;

    module:log('debug', 'Main muc loaded');
    module:log("info", "Hook to muc events on %s", muc_component_host);

    host_module:hook("muc-room-created", room_created, -1);

    -- The room metadata was updated internally (from another module).
    host_module:hook("room-metadata-changed", function(event)
        local room = event.room;
        local json_msg = getMetadataJSON(room);

        local log_json = json_msg;
        if room.jitsiMetadata and room.jitsiMetadata.transcription
                and room.jitsiMetadata.transcription.httpHeaders then
            local metadata_copy = table_shallow_copy(room.jitsiMetadata);
            local transcription_copy = table_shallow_copy(metadata_copy.transcription);
            local headers_redacted = {};
            for k, _ in pairs(transcription_copy.httpHeaders) do
                headers_redacted[k] = '***';
            end
            transcription_copy.httpHeaders = headers_redacted;
            metadata_copy.transcription = transcription_copy;
            log_json = getMetadataJSON(room, metadata_copy) or log_json;
        end
        module:log('info', 'Metadata changed internally in room:%s,meeting_id:%s - broadcasting data:%s', room.jid, room._data.meetingId, log_json);
        broadcastMetadata(room, json_msg);
    end);

    -- TODO: Once clients update to read/write metadata for startMuted policy we can drop this
    -- this is to convert presence settings from old clients to metadata
    host_module:hook('muc-broadcast-presence', function (event)
        local actor, occupant, room, stanza, x = event.actor, event.occupant, event.room, event.stanza, event.x;

        if is_healthcheck_room(room.jid) or occupant.role ~= 'moderator' then
            return;
        end

        local startMuted = stanza:get_child('startmuted', 'http://jitsi.org/jitmeet/start-muted');

        if not startMuted then
            return;
        end

        if not room.jitsiMetadata then
            room.jitsiMetadata = {};
        end

        local startMutedMetadata = room.jitsiMetadata.startMuted or {};

        local audioNewValue = startMuted.attr.audio == 'true';
        local videoNewValue = startMuted.attr.video == 'true';
        local send_update = false;

        if startMutedMetadata.audio ~= audioNewValue then
            startMutedMetadata.audio = audioNewValue;
            send_update = true;
        end
        if startMutedMetadata.video ~= videoNewValue then
            startMutedMetadata.video = videoNewValue;
            send_update = true;
        end

        if send_update then
            room.jitsiMetadata.startMuted = startMutedMetadata;

            host_module:fire_event('room-metadata-changed', { room = room; });
        end
    end);

    -- The the connection jid for authenticated users (like jicofo) stays the same,
    -- so leaving and re-joining will result not sending metatadata again.
    -- Make sure we clear the sent_initial_metadata entry for the occupant on leave.
    host_module:hook("muc-occupant-left", function(event)
        local room, occupant = event.room, event.occupant;

        if room.sent_initial_metadata then
            room.sent_initial_metadata[jid.bare(event.occupant.jid)] = nil;
        end
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

-- checks whether the event is from an occupant of the room specified in the session,
-- if not, it returns an error and stops the processing of the event
local function check_occupant(event)
    local origin, stanza = event.origin, event.stanza;

    local room_name = origin.jitsi_web_query_room;
    if not room_name then
        module:log('warn', 'No room in session: %s', origin.full_jid);
        origin.send(st.error_reply(stanza, 'auth', 'forbidden'));
        return true;
    end

    local subdomain = origin.jitsi_web_query_prefix or '';
    local room = get_room_by_name_and_subdomain(room_name, subdomain);
    if not room then
        module:log('warn', 'Room not found (%s/%s) for %s', subdomain, room_name, origin.full_jid);
        origin.send(st.error_reply(stanza, 'auth', 'forbidden'));
        return true;
    end

    local from = stanza.attr.from or origin.full_jid;
    local occupant = get_occupant_by_real_jid(room, from);

    if not occupant then
        module:log('warn', '%s not an occupant of %s/%s', from, subdomain, room_name);
        origin.send(st.error_reply(stanza, 'auth', 'forbidden'));
        return true;
    end
end

-- Send a message update for metadata before sending the first self presence
function filter_stanza(stanza, session)
    if not stanza.attr or not stanza.attr.to or stanza.name ~= 'presence' or stanza.attr.type == 'unavailable' then
        return stanza;
    end

    local bare_to = jid.bare(stanza.attr.to);
    local muc_x = stanza:get_child('x', MUC_NS..'#user');
    if not muc_x or not presence_check_status(muc_x, '110') then
        return stanza;
    end

    local room = get_room_from_jid(room_jid_match_rewrite(jid.bare(stanza.attr.from)));

    if not room or not room.sent_initial_metadata or is_healthcheck_room(room.jid) then
        return stanza;
    end

    if room.sent_initial_metadata[bare_to] then
        return stanza;
    end

    local occupant;
    for _, o in room:each_occupant() do
        if o.bare_jid == bare_to then
            occupant = o;
        end
    end

    if not occupant then
        module:log('warn', 'No occupant %s found for %s', bare_to, room.jid);
        return stanza;
    end

    room.sent_initial_metadata[bare_to] = true;

    send_metadata(occupant, room, nil, true);

    return stanza;
end
function filter_session(session)
    -- domain mapper is filtering on default priority 0
    -- allowners is -1 and we need it after that, permissions is -2
    filters.add_filter(session, 'stanzas/out', filter_stanza, -3);
end

-- enable filtering presences
filters.add_filter_hook(filter_session);

process_host_module(main_virtual_host, function(host_module)
    local main_host_module = module:context(host_module.host);
    main_host_module:fire_event('jitsi-add-identity', {
        name = 'room_metadata'; host = module.host;
    });

    if extdisco_occpuant_check then
        -- Hook at priority 100 so we run before mod_external_services (default priority 0) for both XEP-0215 v2 and legacy v1.
        main_host_module:hook('iq-get/host/urn:xmpp:extdisco:2:services', check_occupant, 100);
        main_host_module:hook('iq-get/host/urn:xmpp:extdisco:2:service',  check_occupant, 100);
        main_host_module:hook('iq-get/host/urn:xmpp:extdisco:1:services', check_occupant, 100);
        main_host_module:hook('iq-get/host/urn:xmpp:extdisco:1:service',  check_occupant, 100);
    end
end);
