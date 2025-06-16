-- This module is added under the main virtual host domain
--
-- VirtualHost "jitmeet.example.com"
--     modules_enabled = {
--         "end_conference"
--     }
--     end_conference_component = "endconference.jitmeet.example.com"
--
-- Component "endconference.jitmeet.example.com" "end_conference"
--     muc_component = muc.jitmeet.example.com
--
local get_room_by_name_and_subdomain = module:require 'util'.get_room_by_name_and_subdomain;

local END_CONFERENCE_REASON = 'The meeting has been terminated';

-- Since this file serves as both the host module and the component, we rely on the assumption that
-- end_conference_component var would only be define for the host and not in the end_conference component
local end_conference_component = module:get_option_string('end_conference_component');
if end_conference_component then
    -- Advertise end conference so client can pick up the address and use it
    module:add_identity('component', 'end_conference', end_conference_component);
    return;  -- nothing left to do if called as host module
end

-- What follows is logic for the end_conference component

module:depends("jitsi_session");

local muc_component_host = module:get_option_string('muc_component');
if muc_component_host == nil then
    module:log('error', 'No muc_component specified. No muc to operate on!');
    return;
end

module:log('info', 'Starting end_conference for %s', muc_component_host);

-- receives messages from clients to the component to end a conference
function on_message(event)
    local session = event.origin;

    -- Check the type of the incoming stanza to avoid loops:
    if event.stanza.attr.type == 'error' then
        return; -- We do not want to reply to these, so leave.
    end

    if not session or not session.jitsi_web_query_room then
        return false;
    end

    local moderation_command = event.stanza:get_child('end_conference');

    if moderation_command then
        -- get room name with tenant and find room
        local room = get_room_by_name_and_subdomain(session.jitsi_web_query_room, session.jitsi_web_query_prefix);

        if not room then
            module:log('warn', 'No room found found for %s/%s',
                    session.jitsi_web_query_prefix, session.jitsi_web_query_room);
            return false;
        end

        -- check that the participant requesting is a moderator and is an occupant in the room
        local from = event.stanza.attr.from;
        local occupant = room:get_occupant_by_real_jid(from);
        if not occupant then
            module:log('warn', 'No occupant %s found for %s', from, room.jid);
            return false;
        end
        if occupant.role ~= 'moderator' then
            module:log('warn', 'Occupant %s is not moderator and not allowed this operation for %s', from, room.jid);
            return false;
        end

        -- destroy the room
        room:destroy(nil, END_CONFERENCE_REASON);
        module:log('info', 'Room %s destroyed by occupant %s', room.jid, from);
        return true;
    end

    -- return error
    return false
end


-- we will receive messages from the clients
module:hook('message/host', on_message);
