-- Measure the number of messages used in a meeting. Sends amplitude event.
-- Needs to be activated under the muc component where the limit needs to be applied (main muc and breakout muc)
-- Copyright (C) 2023-present 8x8, Inc.

local jid = require 'util.jid';
local http = require 'net.http';
local cjson_safe  = require 'cjson.safe'

local amplitude_endpoint = module:get_option_string('amplitude_endpoint', 'https://api2.amplitude.com/2/httpapi');
local amplitude_api_key = module:get_option_string('amplitude_api_key');

if not amplitude_api_key then
    module:log("warn", "No 'amplitude_api_key' option set, disabling amplitude reporting");
    return
end

local muc_domain_base = module:get_option_string('muc_mapper_domain_base');
local isBreakoutRoom = module.host == 'breakout.' .. muc_domain_base;

local util = module:require 'util';
local is_healthcheck_room = util.is_healthcheck_room;
local extract_subdomain = util.extract_subdomain;

module:log('info', 'Loading measure message count');

local shard_name = module:context(muc_domain_base):get_option_string('shard_name');
local region_name = module:context(muc_domain_base):get_option_string('region_name');
local release_number = module:context(muc_domain_base):get_option_string('release_number');
local http_headers = {
    ['User-Agent'] = 'Prosody ('..prosody.version..'; '..prosody.platform..')',
    ['Content-Type'] = 'application/json'
};

local inspect = require "inspect"

function table.clone(t)
  return {table.unpack(t)}
end

local function event_cb(content_, code_, response_, request_)
    if code_ == 200 or code_ == 204 then
        module:log('debug', 'URL Callback: Code %s, Content %s, Request (host %s, path %s, body %s), Response: %s',
                code_, content_, request_.host, request_.path, inspect(request_.body), inspect(response_));
    else
        module:log('warn', 'URL Callback non successful: Code %s, Content %s, Request (%s), Response: %s',
                code_, content_, inspect(request_), inspect(response_));
    end
end

function send_event(room)
    local user_properties = {
        shard_name = shard_name;
        region_name = region_name;
        release_number = release_number;
    };

    local node = jid.split(room.jid);
    local subdomain, room_name = extract_subdomain(node);
    user_properties.tenant = subdomain or '/';
    user_properties.conference_name = room_name or node;

    local event_properties = {
        messages_count = room._muc_messages_count or 0;
        polls_count = room._muc_polls_count or 0;
    };

    if room.created_timestamp then
        event_properties.duration = (os.time() * 1000 - room.created_timestamp) / 1000;
    end

    local event = {
        api_key = amplitude_api_key;
        events = {
            {
                user_id = room._data.meetingId;
                device_id = room._data.meetingId;
                event_type = 'conference_ended';
                event_properties = event_properties;
                user_properties = user_properties;
            }
        };
    };

    local request = http.request(amplitude_endpoint, {
            headers = http_headers,
            method = "POST",
            body = cjson_safe.encode(event)
        }, event_cb);
end

function on_message(event)
    local stanza = event.stanza;
    local body = stanza:get_child('body');

    if not body then
        -- we ignore messages without body - lobby, polls ...
        return;
    end

    local session = event.origin;
    if not session or not session.jitsi_web_query_room then
        return;
    end

    -- get room name with tenant and find room.
    local room = get_room_by_name_and_subdomain(session.jitsi_web_query_room, session.jitsi_web_query_prefix);
    if not room then
        module:log('warn', 'No room found found for %s/%s',
            session.jitsi_web_query_prefix, session.jitsi_web_query_room);
        return;
    end

    if not room._muc_messages_count then
        room._muc_messages_count = 0;
    end

    room._muc_messages_count = room._muc_messages_count + 1;
end

-- Conference ended, send stats
function room_destroyed(event)
    local room, session = event.room, event.origin;

    if is_healthcheck_room(room.jid) then
        return;
    end

    if isBreakoutRoom then
        return;
    end
    send_event(room);
end

function poll_created(event)
    local session = event.event.origin;

    -- get room name with tenant and find room.
    local room = get_room_by_name_and_subdomain(session.jitsi_web_query_room, session.jitsi_web_query_prefix);
    if not room then
        module:log('warn', 'No room found found for %s/%s',
            session.jitsi_web_query_prefix, session.jitsi_web_query_room);
        return false;
    end

    if not room._muc_polls_count then
        room._muc_polls_count = 0;
    end

    room._muc_polls_count = room._muc_polls_count + 1;
end

module:hook('message/full', on_message); -- private messages
module:hook('message/bare', on_message); -- room messages

module:hook('muc-room-destroyed', room_destroyed, -1);

module:hook('poll-created', poll_created);
