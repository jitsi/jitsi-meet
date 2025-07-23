local util = module:require 'util';
local get_room_by_name_and_subdomain = util.get_room_by_name_and_subdomain;
local is_healthcheck_room = util.is_healthcheck_room;
local internal_room_jid_match_rewrite = util.internal_room_jid_match_rewrite;
local room_jid_match_rewrite = util.room_jid_match_rewrite;
local process_host_module = util.process_host_module;
local table_shallow_copy = util.table_shallow_copy;
local is_admin = util.is_admin;
local array = require "util.array";
local json = require 'cjson.safe';
local st = require 'util.stanza';

local muc_component_host = module:get_option_string('muc_component');
if muc_component_host == nil then
    module:log('error', 'No muc_component specified. No muc to operate on!');
    return;
end

local main_virtual_host = module:get_option_string('muc_mapper_domain_base');
if not main_virtual_host then
    module:log('warn', 'No "muc_mapper_domain_base" option set, disabling AV moderation.');
    return ;
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
    body_json.actor = internal_room_jid_match_rewrite(actorJid);
    body_json.mediaType = mediaType;
    local body_json_str, error = json.encode(body_json);

    if not body_json_str then
        module:log('error', 'error encoding json room:%s error:%s', room.jid, error);
        return;
    end

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
    -- we will be modifying it, so we need a copy
    body_json.whitelists = table_shallow_copy(room.av_moderation);
    if removed then
        body_json.removed = true;
    end
    body_json.mediaType = mediaType;

    -- sanitize, make sure we don't have an empty array as it will encode it as {} not as []
    for _,mediaType in pairs({'audio', 'video', 'desktop'}) do
        if body_json.whitelists[mediaType] and #body_json.whitelists[mediaType] == 0 then
            body_json.whitelists[mediaType] = nil;
        end
    end

    local moderators_body_json_str, error = json.encode(body_json);

    if not moderators_body_json_str then
        module:log('error', 'error encoding moderator json room:%s error:%s', room.jid, error);
        return;
    end

    body_json.whitelists = nil;
    if not removed then
        body_json.approved = true; -- we want to send to participants only that they were approved to unmute
    end
    local participant_body_json_str, error = json.encode(body_json);

    if not participant_body_json_str then
        module:log('error', 'error encoding participant json room:%s error:%s', room.jid, error);
        return;
    end

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

    local json_message, error = json.encode(body_json);
    if not json_message then
        module:log('error', 'skip sending json message to:%s error:%s', jid, error);
        return;
    end

    send_json_message(jid, json_message);
end

function start_av_moderation(room, mediaType, occupant)
    if not room.av_moderation then
        room.av_moderation = {};
        room.av_moderation_actors = {};
    end
    room.av_moderation[mediaType] = array();

    -- add all current moderators to the new whitelist
    for _, room_occupant in room:each_occupant() do
        if room_occupant.role == 'moderator' and not ends_with(room_occupant.nick, '/focus') then
            room.av_moderation[mediaType]:push(internal_room_jid_match_rewrite(room_occupant.nick));
        end
    end

    -- We want to set startMuted policy in metadata, in case of new participants are joining to respect
    -- it, that will be enforced by jicofo
    local startMutedMetadata = room.jitsiMetadata.startMuted or {};

    -- We want to keep the previous value of startMuted for this mediaType if av moderation is disabled
    -- to be able to restore
    local av_moderation_startMuted_restore = room.av_moderation_startMuted_restore or {};
    av_moderation_startMuted_restore[mediaType] = startMutedMetadata[mediaType];
    room.av_moderation_startMuted_restore = av_moderation_startMuted_restore;

    startMutedMetadata[mediaType] = true;
    room.jitsiMetadata.startMuted = startMutedMetadata;

    room.av_moderation_actors[mediaType] = occupant.nick;
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
            module:log('warn', 'No occupant %s found for %s', from, room.jid);
            return false;
        end
        if occupant.role ~= 'moderator' then
            module:log('warn', 'Occupant %s is not moderator and not allowed this operation for %s', from, room.jid);
            return false;
        end

        local mediaType = moderation_command.attr.mediaType;
        if mediaType then
            if mediaType ~= 'audio' and mediaType ~= 'video' and mediaType ~= 'desktop' then
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
                    start_av_moderation(room, mediaType, occupant);
                end
            else
                enabled = false;
                if not room.av_moderation then
                    module:log('warn', 'Concurrent moderator enable/disable request or something is out of sync');
                    return true;
                else
                    room.av_moderation[mediaType] = nil;
                    room.av_moderation_actors[mediaType] = nil;

                    local startMutedMetadata = room.jitsiMetadata.startMuted or {};
                    local av_moderation_startMuted_restore = room.av_moderation_startMuted_restore or {};
                    startMutedMetadata[mediaType] = av_moderation_startMuted_restore[mediaType];
                    room.jitsiMetadata.startMuted = startMutedMetadata;

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

            if enabled then
                -- inform all moderators for the newly created whitelist
                notify_whitelist_change(nil, true, room, mediaType);
            end

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

    if is_healthcheck_room(room.jid) or is_admin(occupant.bare_jid) then
        return;
    end

    -- when first moderator joins if av_can_unmute from password preset is set to false, we enable av moderation for both
    -- audio and video, and set the first moderator as the actor that enabled it
    if room._data.av_can_unmute ~= nil
        and not room._data.av_first_moderator_joined

        -- occupant.role is not reflecting the actual role after set_affiliation is used in same occupant_joined event
        and room:get_role(occupant.nick) == 'moderator' then

        if not room._data.av_can_unmute then
            for _,mediaType in pairs({'audio', 'video', 'desktop'}) do
                start_av_moderation(room, mediaType, occupant);

                notify_occupants_enable(nil, true, room, occupant.nick, mediaType);
            end

            room._data.av_first_moderator_joined = true;
            return;
        end
    end

    if room.av_moderation then
        for _,mediaType in pairs({'audio', 'video', 'desktop'}) do
            if room.av_moderation[mediaType] then
                notify_occupants_enable(
                    occupant.jid, true, room, room.av_moderation_actors[mediaType], mediaType);
            end
        end

        -- NOTE for some reason event.occupant.role is not reflecting the actual occupant role (when changed
        -- from allowners module) but iterating over room occupants returns the correct role
        for _, room_occupant in room:each_occupant() do
            -- if it is a moderator, send the whitelist to every moderator
            if room_occupant.nick == occupant.nick and room_occupant.role == 'moderator' then
                for _,mediaType in pairs({'audio', 'video', 'desktop'}) do
                    if room.av_moderation[mediaType] then
                        notify_whitelist_change(nil, true, room, mediaType);
                    end
                end
            end
        end
    end
end

-- when a occupant was granted moderator we need to update him with the whitelist
function occupant_affiliation_changed(event)
    local room = event.room;
    if not room.av_moderation or is_healthcheck_room(room.jid) or is_admin(event.jid)
        or event.affiliation ~= 'owner' then
        return;
    end

    -- in any enabled media type add the new moderator to the whitelist
    for _, room_occupant in room:each_occupant() do
        if room_occupant.bare_jid == event.jid then
            for _,mediaType in pairs({'audio', 'video', 'desktop'}) do
                if room.av_moderation[mediaType] then
                    room.av_moderation[mediaType]:push(internal_room_jid_match_rewrite(room_occupant.nick));
                end
            end
        end
    end

    -- the actor can be nil if is coming from allowners or similar module we want to skip it here
    -- as we will handle it in occupant_joined
    if event.actor and event.affiliation == 'owner' then
        -- notify all moderators for the new grant moderator and the change in whitelists
        for _,mediaType in pairs({'audio', 'video', 'desktop'}) do
            if room.av_moderation[mediaType] then
                notify_whitelist_change(nil, true, room, mediaType);
            end
        end
    end
end

-- we will receive messages from the clients
module:hook('message/host', on_message);

process_host_module(muc_component_host, function(host_module, host)
    module:log('info','Hook to muc events on %s', host);
    host_module:hook('muc-occupant-joined', occupant_joined, -2); -- make sure it runs after allowners or similar
    host_module:hook('muc-set-affiliation', occupant_affiliation_changed, -1);
end);

process_host_module(main_virtual_host, function(host_module)
    module:context(host_module.host):fire_event('jitsi-add-identity', {
        name = 'av_moderation'; host = module.host;
    });
end);
