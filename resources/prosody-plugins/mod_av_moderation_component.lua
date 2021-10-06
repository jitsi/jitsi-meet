local get_room_by_name_and_subdomain = module:require 'util'.get_room_by_name_and_subdomain;
local is_healthcheck_room = module:require 'util'.is_healthcheck_room;
local internal_room_jid_match_rewrite = module:require "util".internal_room_jid_match_rewrite;
local room_jid_match_rewrite = module:require "util".room_jid_match_rewrite;
local array = require "util.array";
local json = require 'util.json';
local st = require 'util.stanza';

local muc_component_host = module:get_option_string('muc_component');
if muc_component_host == nil then
    log('error', 'No muc_component specified. No muc to operate on!');
    return;
end

module:log('info', 'Starting av_moderation for %s', muc_component_host);

-- Returns the index of the given element in the table
-- @param table in which to look
-- @param elem the element for which to find the index
function get_index_in_table(table, elem)
    for index, value in pairs(table) do
        if value == elem then
            return index
        end
    end
end

-- Sends a json-message to the destination jid
-- @param to_jid the destination jid
-- @param json_message the message content to send
function send_json_message(to_jid, json_message)
    local stanza = st.message({ from = module.host; to = to_jid; })
         :tag('json-message', { xmlns = 'http://jitsi.org/jitmeet' }):text(json_message):up();
    module:send(stanza);
end

-- Notifies that av moderation has been enabled or disabled
-- @param jid the jid to notify, if missing will notify all occupants
-- @param enable whether it is enabled or disabled
-- @param room the room
-- @param actorJid the jid that is performing the enable/disable operation (the muc jid)
-- @param mediaType the media type for the moderation
function notify_occupants_enable(jid, enable, room, actorJid, mediaType)
    local body_json = {};
    body_json.type = 'av_moderation';
    body_json.enabled = enable;
    body_json.room = internal_room_jid_match_rewrite(room.jid);
    body_json.actor = actorJid;
    body_json.mediaType = mediaType;
    local body_json_str = json.encode(body_json);

    if jid then
        send_json_message(jid, body_json_str)
    else
        for _, occupant in room:each_occupant() do
            send_json_message(occupant.jid, body_json_str)
        end
    end
end

-- Notifies about a change to the whitelist. Notifies all moderators and admin and the jid itself
-- @param jid the jid to notify about the change
-- @param moderators whether to notify all moderators in the room
-- @param room the room where to send it
-- @param mediaType used only when a participant is approved (not sent to moderators)
-- @param removed whether the jid is removed or added
function notify_whitelist_change(jid, moderators, room, mediaType, removed)
    local body_json = {};
    body_json.type = 'av_moderation';
    body_json.room = internal_room_jid_match_rewrite(room.jid);
    body_json.whitelists = room.av_moderation;
    if removed then
        body_json.removed = true;
    end
    body_json.mediaType = mediaType;
    local moderators_body_json_str = json.encode(body_json);
    body_json.whitelists = nil;
    if not removed then
        body_json.approved = true; -- we want to send to participants only that they were approved to unmute
    end
    local participant_body_json_str = json.encode(body_json);

    for _, occupant in room:each_occupant() do
        if moderators and occupant.role == 'moderator' then
            send_json_message(occupant.jid, moderators_body_json_str);
        elseif occupant.jid == jid then
            -- if the occupant is not moderator we send him that it is approved
            -- if it is moderator we update him with the list, this is moderator joining or grant moderation was executed
            if occupant.role == 'moderator' then
                send_json_message(occupant.jid, moderators_body_json_str);
            else
                send_json_message(occupant.jid, participant_body_json_str);
            end
        end
    end
end

-- Notifies jid that is approved. This is a moderator to jid message to ask to unmute,
-- @param jid the jid to notify about the change
-- @param from the jid that triggered this
-- @param room the room where to send it
-- @param mediaType the mediaType it was approved for
function notify_jid_approved(jid, from, room, mediaType)
    local body_json = {};
    body_json.type = 'av_moderation';
    body_json.room = internal_room_jid_match_rewrite(room.jid);
    body_json.approved = true; -- we want to send to participants only that they were approved to unmute
    body_json.mediaType = mediaType;
    body_json.from = from;

    send_json_message(jid, json.encode(body_json));
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

        -- check that the participant requesting is a moderator and is an occupant in the room
        local from = event.stanza.attr.from;
        local occupant = room:get_occupant_by_real_jid(from);
        if not occupant then
            log('warn', 'No occupant %s found for %s', from, room.jid);
            return false;
        end
        if occupant.role ~= 'moderator' then
            log('warn', 'Occupant %s is not moderator and not allowed this operation for %s', from, room.jid);
            return false;
        end

        local mediaType = moderation_command.attr.mediaType;
        if mediaType then
            if mediaType ~= 'audio' and mediaType ~= 'video' then
                module:log('warn', 'Wrong mediaType %s for %s', mediaType, room.jid);
                return false;
            end
        else
            module:log('warn', 'Missing mediaType for %s', room.jid);
            return false;
        end

        if moderation_command.attr.enable ~= nil then
            local enabled;
            if moderation_command.attr.enable == 'true' then
                enabled = true;
                if room.av_moderation and room.av_moderation[mediaType] then
                    module:log('warn', 'Concurrent moderator enable/disable request or something is out of sync');
                    return true;
                else
                    if not room.av_moderation then
                        room.av_moderation = {};
                        room.av_moderation_actors = {};
                    end
                    room.av_moderation[mediaType] = array{};
                    room.av_moderation_actors[mediaType] = occupant.nick;
                end
            else
                enabled = false;
                if not room.av_moderation then
                    module:log('warn', 'Concurrent moderator enable/disable request or something is out of sync');
                    return true;
                else
                    room.av_moderation[mediaType] = nil;
                    room.av_moderation_actors[mediaType] = nil;

                    -- clears room.av_moderation if empty
                    local is_empty = true;
                    for key,_ in pairs(room.av_moderation) do
                        if room.av_moderation[key] then
                            is_empty = false;
                        end
                    end
                    if is_empty then
                        room.av_moderation = nil;
                    end
                end
            end

            -- send message to all occupants
            notify_occupants_enable(nil, enabled, room, occupant.nick, mediaType);
            return true;
        elseif moderation_command.attr.jidToWhitelist then
            local occupant_jid = moderation_command.attr.jidToWhitelist;
            -- check if jid is in the room, if so add it to whitelist
            -- inform all moderators and admins and the jid
            local occupant_to_add = room:get_occupant_by_nick(room_jid_match_rewrite(occupant_jid));
            if not occupant_to_add then
                module:log('warn', 'No occupant %s found for %s', occupant_jid, room.jid);
                return false;
            end

            if room.av_moderation then
                local whitelist = room.av_moderation[mediaType];
                if not whitelist then
                    whitelist = array{};
                    room.av_moderation[mediaType] = whitelist;
                end
                whitelist:push(occupant_jid);

                notify_whitelist_change(occupant_to_add.jid, true, room, mediaType, false);

                return true;
            else
                -- this is a moderator asking the jid to unmute without enabling av moderation
                -- let's just send the event
                notify_jid_approved(occupant_to_add.jid, occupant.nick, room, mediaType);
            end
        elseif moderation_command.attr.jidToBlacklist then
            local occupant_jid = moderation_command.attr.jidToBlacklist;
            -- check if jid is in the room, if so remove it from the whitelist
            -- inform all moderators and admins
            local occupant_to_remove = room:get_occupant_by_nick(room_jid_match_rewrite(occupant_jid));
            if not occupant_to_remove then
                module:log('warn', 'No occupant %s found for %s', occupant_jid, room.jid);
                return false;
            end

            if room.av_moderation then
                local whitelist = room.av_moderation[mediaType];
                if whitelist then
                    local index = get_index_in_table(whitelist, occupant_jid)
                    if(index) then
                        whitelist:pop(index);
                        notify_whitelist_change(occupant_to_remove.jid, true, room, mediaType, true);
                    end
                end

                return true;
            end
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
        for _,mediaType in pairs({'audio', 'video'}) do
            if room.av_moderation[mediaType] then
                notify_occupants_enable(
                    occupant.jid, true, room, room.av_moderation_actors[mediaType], mediaType);
            end
        end

        -- NOTE for some reason event.occupant.role is not reflecting the actual occupant role (when changed
        -- from allowners module) but iterating over room occupants returns the correct role
        for _, room_occupant in room:each_occupant() do
            -- if moderator send the whitelist
            if room_occupant.nick == occupant.nick and room_occupant.role == 'moderator'  then
                notify_whitelist_change(room_occupant.jid, false, room);
            end
        end
    end
end

-- when a occupant was granted moderator we need to update him with the whitelist
function occupant_affiliation_changed(event)
    -- the actor can be nil if is coming from allowners or similar module we want to skip it here
    -- as we will handle it in occupant_joined
    if event.actor and event.affiliation == 'owner' and event.room.av_moderation then
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
        muc_module:hook('muc-occupant-joined', occupant_joined, -2); -- make sure it runs after allowners or similar
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
