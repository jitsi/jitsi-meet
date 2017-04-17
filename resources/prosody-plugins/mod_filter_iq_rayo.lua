local st = require "util.stanza";

local token_util = module:require "token/util".new(module);

-- no token configuration but required
if token_util == nil then
    log("error", "no token configuration but it is required");
    return;
end

-- filters rayo iq in case of requested from not jwt authenticated sessions
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
                or not token_util:verify_room(session, roomName) then
                module:log("info",
                    "Filtering stanza dial, stanza:%s", tostring(stanza));
                session.send(st.error_reply(stanza, "auth", "forbidden"));
                return true;
            end
        end
    end
end);
