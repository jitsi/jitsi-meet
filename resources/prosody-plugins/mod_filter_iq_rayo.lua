local new_throttle = require "util.throttle".create;
local st = require "util.stanza";

local token_util = module:require "token/util".new(module);
local room_jid_match_rewrite = module:require "util".room_jid_match_rewrite;
local is_feature_allowed = module:require "util".is_feature_allowed;

-- no token configuration but required
if token_util == nil then
    log("error", "no token configuration but it is required");
    return;
end

-- The maximum number of simultaneous calls,
-- and also the maximum number of new calls per minute that a session is allowed to create.
local limit_outgoing_calls;
local function load_config()
    limit_outgoing_calls = module:get_option_number("max_number_outgoing_calls", -1);
end
load_config();

-- Header names to use to push extra data extracted from token, if any
local OUT_INITIATOR_USER_ATTR_NAME = "X-outbound-call-initiator-user";
local OUT_INITIATOR_GROUP_ATTR_NAME = "X-outbound-call-initiator-group";
local OUTGOING_CALLS_THROTTLE_INTERVAL = 60; -- if max_number_outgoing_calls is enabled it will be
                                             -- the max number of outgoing calls a user can try for a minute

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
                module:log("warn",
                    "Filtering stanza dial, stanza:%s", tostring(stanza));
                session.send(st.error_reply(stanza, "auth", "forbidden"));
                return true;
            end

            -- now lets check any limits if configured
            if limit_outgoing_calls > 0 then
                if not session.dial_out_throttle then
                    module:log("debug", "Enabling dial-out throttle session=%s.", session);
                    session.dial_out_throttle = new_throttle(limit_outgoing_calls, OUTGOING_CALLS_THROTTLE_INTERVAL);
                end

                if not session.dial_out_throttle:poll(1) -- we first check the throttle so we can mark one incoming dial for the balance
                    or get_concurrent_outgoing_count(session.jitsi_meet_context_user["id"], session.jitsi_meet_context_group)
                            >= limit_outgoing_calls
                then
                    module:log("warn",
                        "Filtering stanza dial, stanza:%s, outgoing calls limit reached", tostring(stanza));
                    session.send(st.error_reply(stanza, "cancel", "resource-constraint"));
                    return true;
                end
            end

            -- now lets insert token information if any
            if session and session.jitsi_meet_context_user then
                -- First remove any 'header' element if it already
                -- exists, so it cannot be spoofed by a client
                stanza:maptags(
                    function(tag)
                        if tag.name == "header"
                                and (tag.attr.name == OUT_INITIATOR_USER_ATTR_NAME
                                        or tag.attr.name == OUT_INITIATOR_GROUP_ATTR_NAME) then
                            return nil
                        end
                        return tag
                    end
                )

                local dial = stanza:get_child('dial', 'urn:xmpp:rayo:1');
                -- adds initiator user id from token
                dial:tag("header", {
                    xmlns = "urn:xmpp:rayo:1",
                    name = OUT_INITIATOR_USER_ATTR_NAME,
                    value = session.jitsi_meet_context_user["id"] });
                dial:up();

                -- Add the initiator group information if it is present
                if session.jitsi_meet_context_group then
                    dial:tag("header", {
                        xmlns = "urn:xmpp:rayo:1",
                        name = OUT_INITIATOR_GROUP_ATTR_NAME,
                        value = session.jitsi_meet_context_group });
                    dial:up();
                end
            end
        end
    end
end);

--- Finds and returns the number of concurrent outgoing calls for a user
-- @param context_user the user id extracted from the token
-- @param context_group the group id extracted from the token
-- @return returns the count of concurrent calls
function get_concurrent_outgoing_count(context_user, context_group)
    local count = 0;
    for _, host in pairs(hosts) do
        local component = host;
        if component then
            local muc = component.modules.muc
            local rooms = nil;
            if muc and rawget(muc,"rooms") then
                -- We're running 0.9.x or 0.10 (old MUC API)
                return muc.rooms;
            elseif muc and rawget(muc,"live_rooms") then
                -- We're running >=0.11 (new MUC API)
                rooms = muc.live_rooms();
            elseif muc and rawget(muc,"each_room") then
                -- We're running trunk<0.11 (each_room is later [DEPRECATED])
                rooms = muc.each_room(true);
            end

            -- now lets iterate over rooms and occupants and search for
            -- call initiated by the user
            if rooms then
                for room in rooms do
                    for _, occupant in room:each_occupant() do
                        for _, presence in occupant:each_session() do

                            local initiator = presence:get_child('initiator', 'http://jitsi.org/protocol/jigasi');

                            local found_user = false;
                            local found_group = false;

                            if initiator then
                                initiator:maptags(function (tag)
                                    if tag.name == "header"
                                        and tag.attr.name == OUT_INITIATOR_USER_ATTR_NAME then
                                        found_user = tag.attr.value == context_user;
                                    elseif tag.name == "header"
                                        and tag.attr.name == OUT_INITIATOR_GROUP_ATTR_NAME then
                                        found_group = tag.attr.value == context_group;
                                    end

                                    return tag;
                                end );
                                -- if found a jigasi participant initiated by the concurrent
                                -- participant, count it
                                if found_user
                                    and (context_group == nil or found_group) then
                                    count = count + 1;
                                end
                            end
                        end
                    end
                end
            end
        end
    end

    return count;
end

module:hook_global('config-reloaded', load_config);
