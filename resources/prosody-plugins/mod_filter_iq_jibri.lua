-- This module is enabled under the main virtual host
local cache = require 'util.cache';
local new_throttle = require 'util.throttle'.create;
local st = require "util.stanza";
local jid_bare = require "util.jid".bare;
local util = module:require 'util';
local is_feature_allowed = util.is_feature_allowed;
local get_ip = util.get_ip;
local get_room_from_jid = util.get_room_from_jid;
local room_jid_match_rewrite = util.room_jid_match_rewrite;

local limit_jibri_reach_ip_attempts;
local limit_jibri_reach_room_attempts;
local rates_per_ip;
local function load_config()
    limit_jibri_reach_ip_attempts = module:get_option_number("max_number_ip_attempts_per_minute", 9);
    limit_jibri_reach_room_attempts = module:get_option_number("max_number_room_attempts_per_minute", 3);
    -- The size of the cache that saves state for IP addresses
    cache_size = module:get_option_number("jibri_rate_limit_cache_size", 10000);

    -- Maps an IP address to a util.throttle which keeps the rate of attempts to reach jibri events from that IP.
    rates_per_ip = cache.new(cache_size);
end
load_config();

-- filters jibri iq in case of requested from jwt authenticated session that
-- has features in the user context, but without feature for recording
module:hook("pre-iq/full", function(event)
    local stanza = event.stanza;
    if stanza.name == "iq" then
        local jibri = stanza:get_child('jibri', 'http://jitsi.org/protocol/jibri');
        if jibri then
            local session = event.origin;
            local token = session.auth_token;
            local room = get_room_from_jid(room_jid_match_rewrite(jid_bare(stanza.attr.to)));
            local occupant = room:get_occupant_by_real_jid(stanza.attr.from);
            local feature = jibri.attr.recording_mode == 'file' and 'recording' or 'livestreaming';
            local is_allowed = is_feature_allowed(
                feature,
                session.jitsi_meet_context_features,
                session.granted_jitsi_meet_context_features,
                occupant.role == 'moderator');

            if jibri.attr.action == 'start' or jibri.attr.action == 'stop' then
                if not is_allowed then
                    module:log('info', 'Filtering jibri start recording, stanza:%s', tostring(stanza));
                    session.send(st.error_reply(stanza, 'auth', 'forbidden'));
                    return true;
                end

                local ip = get_ip(session);
                if not rates_per_ip:get(ip) then
                    rates_per_ip:set(ip, new_throttle(limit_jibri_reach_ip_attempts, 60));
                end

                if not room.jibri_throttle then
                    room.jibri_throttle = new_throttle(limit_jibri_reach_room_attempts, 60);
                end

                if not rates_per_ip:get(ip):poll(1) or not room.jibri_throttle:poll(1) then
                    module:log('warn', 'Filtering jibri start recording, ip:%s, room:%s stanza:%s',
                        ip, room.jid, tostring(stanza));
                    session.send(st.error_reply(stanza, 'wait', 'policy-violation'));
                    return true;
                end
            end
        end
    end
end);
