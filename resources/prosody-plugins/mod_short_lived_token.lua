-- to be enabled under the main virtual host with all required settings
-- short_lived_token = {
--     issuer = 'myissuer';
--     accepted_audiences = { 'file-sharing' };
--     key_path = '/etc/prosody/short_lived_token.key';
--     key_id = 'my_kid';
--     ttl_seconds = 30;
-- };
-- The key in key_path can be generated via: openssl genrsa -out $PRIVATE_KEY_PATH 2048
-- And you can get the public key from it, which can be used ot verify those tokens via:
-- openssl rsa -in $PRIVATE_KEY_PATH -pubout -out $PUBLIC_KEY_PATH

local jid = require 'util.jid';
local st = require 'util.stanza';
local jwt = module:require 'luajwtjitsi';

local util = module:require 'util';
local is_vpaas = util.is_vpaas;
local process_host_module = util.process_host_module;
local table_find = util.table_find;
local create_throttle = require 'prosody.util.throttle'.create;

local SERVICE_TYPE = 'short-lived-token';
local options = module:get_option('short_lived_token');

if not (options.issuer and options.accepted_audiences
    and options.key_path and options.key_id and options.ttl_seconds) then
    module:log('error', 'Missing required options for short_lived_token');
    return;
end

local f = io.open(options.key_path, 'r');
if f then
    options.key = f:read('*all');
    f:close();
end

local accepted_requests = {};
for _, host in pairs(options.accepted_audiences) do
    accepted_requests[string.format('%s:%s:0', SERVICE_TYPE, host)] = host;
end

local server_region_name = module:get_option_string('region_name');

local main_muc_component_host = module:get_option_string('main_muc');
if main_muc_component_host == nil then
    module:log('error', 'main_muc not configured. Cannot proceed.');
    return;
end
local main_muc_service;

function generateToken(session, audience, room, occupant)
    local t = os.time();
    local exp = t + options.ttl_seconds;
    local presence = occupant:get_presence(session.full_jid);
    local _, _, id = extract_subdomain(jid.node(room.jid));

    local payload = {
        iss = options.issuer,
        aud = audience,
        nbf = t,
        exp = exp,
        sub = session.jitsi_web_query_prefix or module.host,
        context = {
            group = session.jitsi_meet_context_group or session.granted_jitsi_meet_context_group_id,
            user = session.jitsi_meet_context_user or {
                id = session.full_jid,
                name = presence:get_child_text('nick', 'http://jabber.org/protocol/nick'),
                email = presence:get_child_text("email") or nil,
                nick = jid.resource(occupant.nick)
            },
            features = session.jitsi_meet_context_features
        },
        room = session.jitsi_web_query_room,
        meeting_id = room._data.meetingId,
        granted_from = session.granted_jitsi_meet_context_user_id,
        customer_id = id or session.jitsi_meet_context_group or session.granted_jitsi_meet_context_group_id,
        backend_region = server_region_name,
        user_region = session.user_region
    };

    local alg = 'RS256';
    local token, err = jwt.encode(payload, options.key, alg, { kid = options.key_id });
    if not err then
        return token
    else
        module:log('error', 'Error generating token: %s', err);
        return ''
    end
end

module:hook('external_service/credentials', function (event)
    local requested_credentials, services, session, stanza
        = event.requested_credentials, event.services, event.origin, event.stanza;
    local room = get_room_by_name_and_subdomain(session.jitsi_web_query_room, session.jitsi_web_query_prefix);

    if not room then
        session.send(st.error_reply(stanza, 'cancel', 'not-allowed'));
        return;
    end

    local occupant = room:get_occupant_by_real_jid(session.full_jid);
    if not occupant then
        session.send(st.error_reply(stanza, 'cancel', 'not-allowed'));
        return;
    end

    for request in requested_credentials do
        local host = accepted_requests[request];
        if host then
            services:push({
                type = SERVICE_TYPE;
                host = host;
                username = 'token';
                password = generateToken(session, host, room, occupant);
                expires = os.time() + options.ttl_seconds;
                restricted = true;
                transport = 'https';
                port = 443;
            });
        end
    end

end);

process_host_module(main_muc_component_host, function(host_module, host)
    local muc_module = prosody.hosts[host].modules.muc;

    if muc_module then
        main_muc_service = muc_module;
    else
        prosody.hosts[host].events.add_handler('module-loaded', function(event)
            if (event.module == 'muc') then
                main_muc_service = prosody.hosts[host].modules.muc;
            end
        end);
    end
end);
