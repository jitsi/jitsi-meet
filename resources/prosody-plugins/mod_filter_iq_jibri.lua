local st = require "util.stanza";
local is_feature_allowed = module:require "util".is_feature_allowed;
local token_util = module:require "token/util".new(module);

local jibri_iq_token_accepted_issuers;
local jibri_iq_token_accepted_audiences;
local jibri_iq_token_asap_key_server;

local function load_config()
    jibri_iq_token_accepted_issuers = module:get_option_array("jibri_iq_token_accepted_issuers");
    token_util:set_asap_accepted_issuers(jibri_iq_token_accepted_issuers);

    jibri_iq_token_accepted_audiences = module:get_option_array("jibri_iq_token_accepted_audiences", {"jitsi"});
    token_util:set_asap_accepted_audiences(jibri_iq_token_accepted_audiences);

    jibri_iq_token_asap_key_server = module:get_option_string("jibri_iq_token_asap_key_server");
    if jibri_iq_token_asap_key_server then
        token_util:set_asap_key_server(jibri_iq_token_asap_key_server);
    end
end

local function reload_config()
    load_config();

    -- clear ASAP accepted key cache on reload
    token_util:clear_asap_cache();
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

            if jibri.attr.action == 'start' then
                local errorReason;
                if jibri_iq_token_accepted_issuers then
                    local iq_token = jibri.attr.token;
                    if iq_token then
                        local session = {};
                        session.auth_token = iq_token;
                        local verified, reason = token_util:process_and_verify_token(session);
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
                    or not is_feature_allowed(session,
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

module:hook_global('config-reloaded', reload_config);