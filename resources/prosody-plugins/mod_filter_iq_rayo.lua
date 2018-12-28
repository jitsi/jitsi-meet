local st = require "util.stanza";

local token_util = module:require "token/util".new(module);
local room_jid_match_rewrite = module:require "util".room_jid_match_rewrite;
local is_feature_allowed = module:require "util".is_feature_allowed;

-- no token configuration but required
if token_util == nil then
    log("error", "no token configuration but it is required");
    return;
end

-- filters rayo iq in case of requested from not jwt authenticated sessions
-- or if the session has features in user context and it doesn't mention
-- feature "outbound-call" to be enabled
module:hook("pre-iq/full", function(event)
    local stanza = event.stanza;
    if stanza.name == "iq" then
        local dial = stanza:get_child('dial', 'urn:xmpp:rayo:1');
        if dial then
            local session = event.origin;
            local token = session.auth_token;

            -- find header with attr name 'JvbRoomName' and extract its value
            local headerName = 'JvbRoomName';
            local roomName;
            for _, child in ipairs(dial.tags) do
                if (child.name == 'header'
                        and child.attr.name == headerName) then
                    roomName = child.attr.value;
                    break;
                end
            end

            if token == nil
                or roomName == nil
                or not token_util:verify_room(session, room_jid_match_rewrite(roomName))
                or not is_feature_allowed(session,
                            (dial.attr.to == 'jitsi_meet_transcribe' and 'transcription'
                                or 'outbound-call'))
            then
                module:log("info",
                    "Filtering stanza dial, stanza:%s", tostring(stanza));
                session.send(st.error_reply(stanza, "auth", "forbidden"));
                return true;
            end
        end
    end
end);
