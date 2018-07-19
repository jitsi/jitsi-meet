local st = require "util.stanza";
local is_feature_allowed = module:require "util".is_feature_allowed;

-- filters jibri iq in case of requested from jwt authenticated session that
-- has features in the user context, but without feature for recording
module:hook("pre-iq/full", function(event)
    local stanza = event.stanza;
    if stanza.name == "iq" then
        local jibri = stanza:get_child('jibri', 'http://jitsi.org/protocol/jibri');
        if jibri then
            local session = event.origin;
            local token = session.auth_token;

            if jibri.attr.action == 'start'
                and (token == nil
                    or not is_feature_allowed(session,
                        (jibri.attr.recording_mode == 'file' and 'recording' or 'livestreaming'))
                ) then
                module:log("info",
                    "Filtering jibri start recording, stanza:%s", tostring(stanza));
                session.send(st.error_reply(stanza, "auth", "forbidden"));
                return true;
            end
        end
    end
end);
