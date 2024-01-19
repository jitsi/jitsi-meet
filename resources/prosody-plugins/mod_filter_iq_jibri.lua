local st = require "util.stanza";
local is_feature_allowed = module:require "util".is_feature_allowed;
local token_util = module:require "token/util".new(module);

local accepted_rayo_iq_token_issuers = module:get_option_array("accepted_rayo_iq_token_issuers");

-- filters jibri iq in case of requested from jwt authenticated session that
-- has features in the user context, but without feature for recording
module:hook("pre-iq/full", function(event)
    local stanza = event.stanza;
    if stanza.name == "iq" then
        local jibri = stanza:get_child('jibri', 'http://jitsi.org/protocol/jibri');
        if jibri then
            local session = event.origin;
            local token = session.auth_token;

            if jibri.attr.action == 'start' then
                local errorReason;
                if accepted_rayo_iq_token_issuers then
                    local iq_token = jibri.attr.token;
                    if iq_token then
                        local session = {};
                        session.auth_token = iq_token;
                        local verified, reason = token_util:process_and_verify_token(
                            session, accepted_rayo_iq_token_issuers);
                        if verified then
                            return nil; -- this will proceed with dispatching the stanza
                        end
                        errorReason = reason;
                    else
                        errorReason = 'No recording token provided';
                    end

                    module:log("warn", "not a valid token %s", tostring(errorReason));
                    session.send(st.error_reply(stanza, "auth", "forbidden"));
                    return true;
                end

                if token == nil
                    or not is_feature_allowed(session.jitsi_meet_context_features,
                    (jibri.attr.recording_mode == 'file' and 'recording' or 'livestreaming')
                ) then
                    module:log("info",
                        "Filtering jibri start recording, stanza:%s", tostring(stanza));
                    session.send(st.error_reply(stanza, "auth", "forbidden"));
                    return true;
                end
            end
        end
    end
end);
