-- A http endpoint to invite jigasi to a meeting via http endpoint
-- jwt is used to validate access
-- Copyright (C) 2023-present 8x8, Inc.

local jid_split = require "util.jid".split;
local hashes = require "util.hashes";
local random = require "util.random";
local st = require("util.stanza");
local json = require 'cjson.safe';
local util = module:require "util";
local async_handler_wrapper = util.async_handler_wrapper;
local process_host_module = util.process_host_module;

local muc_domain_base = module:get_option_string("muc_mapper_domain_base");

-- This module chooses jigasi from the brewery room, so it needs information for the configured brewery
local muc_domain = module:get_option_string("muc_internal_domain_base", 'internal.auth.' .. muc_domain_base);

local jigasi_brewery_room_jid = module:get_option_string("muc_jigasi_brewery_jid", 'jigasibrewery@' .. muc_domain);

local jigasi_bare_jid = module:get_option_string("muc_jigasi_jid", "jigasi@auth." .. muc_domain_base);
local focus_jid = module:get_option_string("muc_jicofo_brewery_jid", jigasi_brewery_room_jid .. "/focus");

local main_muc_service;
local JSON_CONTENT_TYPE = "application/json";

local event_count = module:measure("muc_invite_jigasi_rate", "rate")
local event_count_success = module:measure("muc_invite_jigasi_success", "rate")
local ASAP_KEY_SERVER = module:get_option_string("prosody_password_public_key_repo_url", "");
local token_util = module:require "token/util".new(module);
if ASAP_KEY_SERVER then
    -- init token util with our asap keyserver
    token_util:set_asap_key_server(ASAP_KEY_SERVER)
end

local function invite_jigasi(conference, phone_no)
    local jigasi_brewery_room = main_muc_service.get_room_from_jid(jigasi_brewery_room_jid);
    if not jigasi_brewery_room then
        module:log("error", "Jigasi brewery room not found")
        return 404, 'Brewery room was not found'
    end
    module:log("info", "Invite jigasi from %s to join conference %s and outbound phone_no %s", jigasi_brewery_room.jid, conference, phone_no)

    --select least stressed Jigasi
    local least_stressed_value = math.huge;
    local least_stressed_jigasi_jid;
    for occupant_jid, occupant in jigasi_brewery_room:each_occupant() do
        local _, _, resource = jid_split(occupant_jid);
        if resource ~= 'focus' then
            local occ = occupant:get_presence();
            local stats_child = occ:get_child("stats", "http://jitsi.org/protocol/colibri")

            local is_sip_jigasi = true;
            for stats_tag in stats_child:children() do
                if stats_tag.attr.name == 'supports_sip' and stats_tag.attr.value == 'false' then
                    is_sip_jigasi = false;
                end
            end

            if is_sip_jigasi then
                for stats_tag in stats_child:children() do
                    if stats_tag.attr.name == 'stress_level' then
                        local stress_level = tonumber(stats_tag.attr.value);
                        module:log("debug", "Stressed level %s %s ", stress_level, occupant_jid)
                        if stress_level < least_stressed_value then
                            least_stressed_jigasi_jid = occupant_jid
                            least_stressed_value = stress_level
                        end
                    end
                end
            end
        end
    end
    module:log("debug", "Least stressed jigasi selected jid %s value %s", least_stressed_jigasi_jid, least_stressed_value)
    if not least_stressed_jigasi_jid then
        module:log("error", "Cannot invite jigasi from room %s", jigasi_brewery_room.jid)
        return 404, 'Jigasi not found'
    end

    -- invite Jigasi to join the conference
    local _, _, jigasi_res = jid_split(least_stressed_jigasi_jid)
    local jigasi_full_jid = jigasi_bare_jid .. "/" .. jigasi_res;
    local stanza_id = hashes.sha256(random.bytes(8), true);

    local invite_jigasi_stanza = st.iq({ xmlns = "jabber:client", type = "set", to = jigasi_full_jid, from = focus_jid, id = stanza_id })
                                   :tag("dial", { xmlns = "urn:xmpp:rayo:1", from = "fromnumber", to = phone_no })
                                   :tag("header", { xmlns = "urn:xmpp:rayo:1", name = "JvbRoomName", value = conference })

    module:log("debug", "Invite jigasi stanza %s", invite_jigasi_stanza)
    jigasi_brewery_room:route_stanza(invite_jigasi_stanza);
    return 200
end

local function is_token_valid(token)
    if token == nil then
        module:log("warn", "no token provided");
        return false;
    end

    local session = {};
    session.auth_token = token;
    local verified, reason, msg = token_util:process_and_verify_token(session);
    if not verified then
        module:log("warn", "not a valid token %s %s", tostring(reason), tostring(msg));
        return false;
    end
    return true;
end

local function handle_jigasi_invite(event)
    module:log("debug", "Request for invite jigasi received: reqId %s", event.request.headers["request_id"])
    event_count()
    local request = event.request;
    -- verify access
    local token = event.request.headers["authorization"]
    if not token then
        module:log("error", "Authorization header was not provided for conference %s", conference)
        return { status_code = 401 };
    end
    if util.starts_with(token, 'Bearer ') then
        token = token:sub(8, #token)
    else
        module:log("error", "Authorization header is invalid")
        return { status_code = 401 };
    end
    if not is_token_valid(token) then
        return { status_code = 401 };
    end

    -- verify payload
    if request.headers.content_type ~= JSON_CONTENT_TYPE
            or (not request.body or #request.body == 0) then
        module:log("warn", "Wrong content type: %s or missing payload", request.headers.content_type);
        return { status_code = 400; }
    end
    local payload, error = json.decode(request.body);

    if not payload then
        module:log('error', 'Cannot decode json error:%s', error);
        return { status_code = 400; }
    end

    local conference = payload["conference"];
    local phone_no = payload["phoneNo"];
    if not conference then
        module:log("warn", "Missing conference param")
        return { status_code = 400; }
    end
    if not phone_no then
        module:log("warn", "Missing phone no param")
        return { status_code = 400; }
    end

    --invite jigasi
    local status_code, error_msg = invite_jigasi(conference, phone_no)

    if not error_msg then
        event_count_success()
        return { status_code = 200 }
    else
        return { status_code = status_code, body = json.encode({ error = error_msg }) }
    end
end

module:log("info", "Adding http handler for /invite-jigasi on %s", module.host);
module:depends("http");
module:provides("http", {
    default_path = "/";
    route = {
        ["POST invite-jigasi"] = function(event)
            return async_handler_wrapper(event, handle_jigasi_invite)
        end;
    };
});

process_host_module(muc_domain, function(_, host)
    local muc_module = prosody.hosts[host].modules.muc;
    if muc_module then
        main_muc_service = muc_module;
        module:log('info', 'Found main_muc_service: %s', main_muc_service);
    else
        module:log('info', 'Will wait for muc to be available');
        prosody.hosts[host].events.add_handler('module-loaded', function(event)
            if (event.module == 'muc') then
                main_muc_service = prosody.hosts[host].modules.muc;
                module:log('info', 'Found(on loaded) main_muc_service: %s', main_muc_service);
            end
        end);
    end
end);

