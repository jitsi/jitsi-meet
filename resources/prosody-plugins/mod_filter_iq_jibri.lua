-- This module is enabled under the main virtual host
local st = require "util.stanza";
local jid_bare = require "util.jid".bare;
local util = module:require 'util';
local is_feature_allowed = util.is_feature_allowed;
local get_room_from_jid = util.get_room_from_jid;
local room_jid_match_rewrite = util.room_jid_match_rewrite;

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

            if jibri.attr.action == 'start' and not is_allowed then
                module:log('info', 'Filtering jibri start recording, stanza:%s', tostring(stanza));
                session.send(st.error_reply(stanza, 'auth', 'forbidden'));
                return true;
            end
        end
    end
end);
