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
            local feature = jibri.attr.recording_mode == 'file' and 'recording' or 'livestreaming';
            local is_allowed = is_feature_allowed(session.jitsi_meet_context_features, feature);

            -- if current user is not allowed, but was granted moderation by a user
            -- that is allowed by its features we want to allow it
            local is_granting_allowed = false;
            if session.granted_jitsi_meet_context_features then
                is_granting_allowed = is_feature_allowed(session.granted_jitsi_meet_context_features, feature);
            end

            if jibri.attr.action == 'start' then
                if token == nil or not (is_allowed or is_granting_allowed)
                then
                    if not session.jitsi_meet_context_features and not session.granted_jitsi_meet_context_features then
                        -- we need to check for moderator rights
                        -- when there are no features and the occupant is moderator we allow recording
                        local room = get_room_from_jid(room_jid_match_rewrite(jid_bare(stanza.attr.to)));
                        local occupant = room:get_occupant_by_real_jid(stanza.attr.from);

                        if occupant.role == 'moderator' then
                            return;
                        end
                    end

                    module:log("info",
                        "Filtering jibri start recording, stanza:%s", tostring(stanza));
                    session.send(st.error_reply(stanza, "auth", "forbidden"));
                    return true;
                end
            end
        end
    end
end);
