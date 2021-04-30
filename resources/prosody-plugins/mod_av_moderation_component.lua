local get_room_by_name_and_subdomain = module:require 'util'.get_room_by_name_and_subdomain;
local is_healthcheck_room = module:require 'util'.is_healthcheck_room;
local json = require 'util.json';
local st = require 'util.stanza';
local um_is_admin = require "core.usermanager".is_admin;

local muc_component_host = module:get_option_string('muc_component');
if muc_component_host == nil then
    log('error', 'No muc_component specified. No muc to operate on!');
    return;
end

module:log('info', 'Starting av_moderation for %s', muc_component_host);

local function is_admin(jid)
    return um_is_admin(jid, module.host);
end

-- Notifies that av moderation has been enabled or disabled
-- @param jid the jid to notify, if missing will notify all occupants
function notify_occupants_enable(jid, enable, room)
    local body_json = {};
    body_json.type = 'av_moderation';
    body_json.enabled = enable;
    body_json.room = room.jid;
    local body_json_str = json.encode(body_json);

    local notify = function(jid_to_notify)
        local stanza = st.message({ from = module.host; to = jid_to_notify; })
                :tag('json-message', { xmlns = 'http://jitsi.org/jitmeet' }):text(body_json_str):up();
        module:send(stanza);
    end

    if jid then
        notify(jid);
    else
        for _, occupant in room:each_occupant() do
            notify(occupant.jid);
        end
    end

end

-- Notifies about a jid added to the whitelist. Notifies all moderators and admin and the jid itself
-- @param jid the jid to notify about the change
-- @param moderators whether to notify all moderators in the room
-- @param room the room where to send it
function notify_whitelist_change(jid, moderators, room)
    local body_json = {};
    body_json.type = 'av_moderation';
    body_json.whitelists = room.av_moderation;
    body_json.room = room.jid;
    local body_json_str = json.encode(body_json);

    for _, occupant in room:each_occupant() do
        if (moderators and occupant.role == 'moderator') or occupant.jid == jid then
            local stanza = st.message({
                from = module.host; to = occupant.jid; }):tag('json-message',{ xmlns = 'http://jitsi.org/jitmeet' })
                    :text(body_json_str):up();
            module:send(stanza);
        end
    end

end

-- receives messages from clients to the component sending A/V moderation enable/disable commands or adding
-- jids to the whitelist
function on_message(event)
    local session = event.origin;

    -- Check the type of the incoming stanza to avoid loops:
    if event.stanza.attr.type == 'error' then
        return; -- We do not want to reply to these, so leave.
    end

    if not session or not session.jitsi_web_query_room then
        return false;
    end

    local moderation_command = event.stanza:get_child('av_moderation');

    if moderation_command then
        -- get room name with tenant and find room
        local room = get_room_by_name_and_subdomain(session.jitsi_web_query_room, session.jitsi_web_query_prefix);

        if not room then
            module:log('warn', 'No room found found for %s/%s',
                    session.jitsi_web_query_prefix, session.jitsi_web_query_room);
            return false;
        end

        if moderation_command.attr.enable ~= nil then
            local enabled;
            if moderation_command.attr.enable == 'true' then
                enabled = true;
                if room.av_moderation then
                    module:log('warn', 'Concurrent moderator enable/disable request or something is out of sync');
                else
                    room.av_moderation = {};
                end
            else
                enabled = false;
                if not room.av_moderation then
                    module:log('warn', 'Concurrent moderator enable/disable request or something is out of sync');
                else
                    room.av_moderation = nil;
                end
            end

            -- send message to all occupants
            notify_occupants_enable(nil, enabled, room);
            return true;
        elseif moderation_command.attr.jidToWhitelist and moderation_command.attr.mediaType and room.av_moderation then

            local mediaType = moderation_command.attr.mediaType;

            if mediaType ~= 'audio' and mediaType ~= 'video' then
                module:log('warn', 'Wrong mediaType %s for %s', mediaType, room.jid);
                return false;
            end

            local occupant_jid = moderation_command.attr.jidToWhitelist;
            -- check if jid is in the room, if so add it to whitelist
            -- inform all moderators and admins and the jid
            local occupant = room:get_occupant_by_nick(occupant_jid);

            if not occupant then
                module:log('warn', 'No occupant %s found for %s', occupant_jid, room.jid);
                return false;
            end

            local whitelist = room.av_moderation[mediaType];
            if not whitelist then
                whitelist = {};
                room.av_moderation[mediaType] = whitelist;
            end
            table.insert(whitelist, occupant_jid);

            notify_whitelist_change(occupant.jid, true, room);

            return true;
        end
    end

    -- return error
    return false
end

-- handles new occupants to inform them about the state enabled/disabled, new moderators also get and the whitelist
function occupant_joined(event)
    local room, occupant = event.room, event.occupant;

    if is_healthcheck_room(room.jid) then
        return;
    end

    if room.av_moderation then
        notify_occupants_enable(occupant.jid, true, room);

        -- if moderator send the whitelist
        if occupant.role == 'moderator' then
            notify_whitelist_change(occupant.jid, false, room);
        end
    end
end

-- when a occupant was granted moderator we need to update him with the whitelist
function occupant_affiliation_changed(event)
    -- if set from someone and is owner (and that is not jicofo - not admin)
    if event.actor and event.affiliation == 'owner' and not is_admin(event.actor) then
        local room = event.room;
        -- event.jid is the bare jid of participant
        for _, occupant in room:each_occupant() do
            if occupant.bare_jid == event.jid then
                notify_whitelist_change(occupant.jid, false, room);
            end
        end
    end
end

-- we will receive messages from the clients
module:hook('message/host', on_message);

-- executed on every host added internally in prosody, including components
function process_host(host)
    if host == muc_component_host then -- the conference muc component
        module:log('info','Hook to muc events on %s', host);

        local muc_module = module:context(host);
        muc_module:hook('muc-occupant-joined', occupant_joined, -1);
        muc_module:hook('muc-set-affiliation', occupant_affiliation_changed, -1);
    end
end

if prosody.hosts[muc_component_host] == nil then
    module:log('info', 'No muc component found, will listen for it: %s', muc_component_host);

    -- when a host or component is added
    prosody.events.add_handler('host-activated', process_host);
else
    process_host(muc_component_host);
end
