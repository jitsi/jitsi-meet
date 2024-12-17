--- activate under main muc component
--- Add the following config under the main muc component
---  muc_room_default_presence_broadcast = {
---        visitor = false;
---        participant = true;
---        moderator = true;
---    };
--- Enable in global modules: 's2s_bidi'
--- Make sure 's2s' is not in modules_disabled
--- NOTE: Make sure all communication between prosodies is using the real jids ([foo]room1@muc.example.com), as there
--- are certain configs for whitelisted domains and connections that are domain based
--- TODO: filter presence from main occupants back to main prosody
local jid = require 'util.jid';
local st = require 'util.stanza';
local new_id = require 'util.id'.medium;
local filters = require 'util.filters';
local array = require 'util.array';
local set = require 'util.set';

local util = module:require 'util';
local ends_with = util.ends_with;
local is_vpaas = util.is_vpaas;
local room_jid_match_rewrite = util.room_jid_match_rewrite;
local get_room_from_jid = util.get_room_from_jid;
local get_focus_occupant = util.get_focus_occupant;
local internal_room_jid_match_rewrite = util.internal_room_jid_match_rewrite;
local presence_check_status = util.presence_check_status;
local respond_iq_result = util.respond_iq_result;

local PARTICIPANT_PROP_RAISE_HAND = 'jitsi_participant_raisedHand';
local PARTICIPANT_PROP_REQUEST_TRANSCRIPTION = 'jitsi_participant_requestingTranscription';
local PARTICIPANT_PROP_TRANSLATION_LANG = 'jitsi_participant_translation_language';
local TRANSCRIPT_DEFAULT_LANG = module:get_option_string('transcriptions_default_language', 'en');

-- this is the main virtual host of this vnode
local local_domain = module:get_option_string('muc_mapper_domain_base');
if not local_domain then
    module:log('warn', "No 'muc_mapper_domain_base' option set, disabling fmuc plugin");
    return;
end

-- this is the main virtual host of the main prosody that this vnode serves
local main_domain = module:get_option_string('main_domain');
if not main_domain then
    module:log('warn', "No 'main_domain' option set, disabling fmuc plugin");
    return;
end

local muc_domain_prefix = module:get_option_string('muc_mapper_domain_prefix', 'conference');
local local_muc_domain = muc_domain_prefix..'.'..local_domain;

local NICK_NS = 'http://jabber.org/protocol/nick';

-- in certain cases we consider participants with token as moderators, this is the default behavior which can be turned off
local auto_promoted_with_token = module:get_option_boolean('visitors_auto_promoted_with_token', true);

-- we send stats for the total number of rooms, total number of participants and total number of visitors
local measure_rooms = module:measure('vnode-rooms', 'amount');
local measure_participants = module:measure('vnode-participants', 'amount');
local measure_visitors = module:measure('vnode-visitors', 'amount');

local sent_iq_cache = require 'util.cache'.new(200);

local sessions = prosody.full_sessions;

local um_is_admin = require 'core.usermanager'.is_admin;
local function is_admin(jid)
    return um_is_admin(jid, module.host);
end

local function send_transcriptions_update(room)
    -- let's notify main prosody
    local lang_array = array();
    local count = 0;

    for k, v in pairs(room._transcription_languages) do
        lang_array:push(v);
        count = count + 1;
    end

    local iq_id = new_id();
    sent_iq_cache:set(iq_id, socket.gettime());
    module:send(st.iq({
        type = 'set',
        to = 'visitors.'..main_domain,
        from = local_domain,
        id = iq_id })
      :tag('visitors', { xmlns = 'jitsi:visitors',
                         room = jid.join(jid.node(room.jid), muc_domain_prefix..'.'..main_domain) })
      :tag('transcription-languages', {
        xmlns = 'jitsi:visitors',
        langs = lang_array:unique():sort():concat(','),
        count = tostring(count)
      }):up());
end

local function remove_transcription(room, occupant)
    local send_update = false;
    if room._transcription_languages then
        if room._transcription_languages[occupant.jid] then
            send_update = true;
        end
        room._transcription_languages[occupant.jid] = nil;
    end

    if send_update then
        send_transcriptions_update(room);
    end
end

-- if lang is nil we will remove it from the list
local function add_transcription(room, occupant, lang)
    if not room._transcription_languages then
        room._transcription_languages = {};
    end

    local old = room._transcription_languages[occupant.jid];
    room._transcription_languages[occupant.jid] = lang or TRANSCRIPT_DEFAULT_LANG;

    if old ~= room._transcription_languages[occupant.jid] then
        send_transcriptions_update(room);
    end
end

-- mark all occupants as visitors
module:hook('muc-occupant-pre-join', function (event)
    local occupant, room, origin, stanza = event.occupant, event.room, event.origin, event.stanza;
    local node, host = jid.split(occupant.bare_jid);
    local resource = jid.resource(occupant.nick);

    if is_admin(occupant.bare_jid) then
        return;
    end

    if prosody.hosts[host] then
        -- local participants which host is defined in this prosody
        if room._main_room_lobby_enabled then
            origin.send(st.error_reply(stanza, 'cancel', 'not-allowed', 'Visitors not allowed while lobby is on!')
                :tag('no-visitors-lobby', { xmlns = 'jitsi:visitors' }));
            return true;
        else
            occupant.role = 'visitor';
        end
    elseif room.moderators_list and room.moderators_list:contains(resource) then
        -- remote participants, host is the main prosody
        occupant.role = 'moderator';
    end
end, 3);

-- if a visitor leaves we want to lower its hand if it was still raised before leaving
-- this is to clear indication for promotion on moderators visitors list
module:hook('muc-occupant-pre-leave', function (event)
    local occupant = event.occupant;

    ---- we are interested only of visitors presence
    if occupant.role ~= 'visitor' then
        return;
    end

    local room = event.room;

    -- let's check if the visitor has a raised hand send a lower hand
    -- to main prosody
    local pr = occupant:get_presence();

    local raiseHand = pr:get_child_text(PARTICIPANT_PROP_RAISE_HAND);

    -- a promotion detected let's send it to main prosody
    if raiseHand and #raiseHand > 0 then
        local iq_id = new_id();
        sent_iq_cache:set(iq_id, socket.gettime());
        local promotion_request = st.iq({
            type = 'set',
            to = 'visitors.'..main_domain,
            from = local_domain,
            id = iq_id })
          :tag('visitors', { xmlns = 'jitsi:visitors',
                             room = jid.join(jid.node(room.jid), muc_domain_prefix..'.'..main_domain) })
          :tag('promotion-request', {
            xmlns = 'jitsi:visitors',
            jid = occupant.jid,
            time = nil;
          }):up();

        module:send(promotion_request);
    end

     remove_transcription(room, occupant);
end, 1); -- rate limit is 0

-- Returns the main participants count and the visitors count
local function get_occupant_counts(room)
    local main_count = 0;
    local visitors_count = 0;

    for _, o in room:each_occupant() do
        if o.role == 'visitor' then
            visitors_count = visitors_count + 1;
        elseif not is_admin(o.bare_jid) then
            main_count = main_count + 1;
        end
    end

    return main_count, visitors_count;
end

local function cancel_destroy_timer(room)
    if room.visitors_destroy_timer then
        room.visitors_destroy_timer:stop();
        room.visitors_destroy_timer = nil;
    end
end

-- schedules a new destroy timer which will destroy the room if there are no visitors after the timeout
local function schedule_destroy_timer(room)
    cancel_destroy_timer(room);

    room.visitors_destroy_timer = module:add_timer(15, function()
        -- if the room is being destroyed, ignore
        if room.destroying then
            return;
        end

        local main_count, visitors_count = get_occupant_counts(room);

        if visitors_count == 0 then
            module:log('info', 'Will destroy:%s main_occupants:%s visitors:%s', room.jid, main_count, visitors_count);
            room:destroy(nil, 'No visitors.');
        end
    end);
end

-- when occupant is leaving forward presences to jicofo for visitors
-- do not check occupant.role as it maybe already reset
-- if there are no main occupants or no visitors, destroy the room (give 15 seconds of grace period for reconnections)
module:hook('muc-occupant-left', function (event)
    local room, occupant = event.room, event.occupant;
    local occupant_domain = jid.host(occupant.bare_jid);

    if prosody.hosts[occupant_domain] and not is_admin(occupant.bare_jid) then
        local focus_occupant = get_focus_occupant(room);
        if not focus_occupant then
            if not room.destroying then
                module:log('warn', 'No focus found for %s', room.jid);
            end
            return;
        end
        -- Let's forward unavailable presence to the special jicofo
        room:route_stanza(st.presence({
            to = focus_occupant.jid,
            from = internal_room_jid_match_rewrite(occupant.nick),
            type = 'unavailable' })
                     :tag('x', { xmlns = 'http://jabber.org/protocol/muc#user' })
                     :tag('item', {
            affiliation = room:get_affiliation(occupant.bare_jid) or 'none';
            role = 'none';
            nick = event.nick;
            jid = occupant.bare_jid }):up():up());
    end

    -- if the room is being destroyed, ignore
    if room.destroying then
        return;
    end

    -- if there are no main participants, the main room will be destroyed and
    -- we can destroy and the visitor one as when jicofo leaves all visitors will reload
    -- if there are no visitors give them 15 secs to reconnect, if not destroy it
    local main_count, visitors_count = get_occupant_counts(room);

    if visitors_count == 0 then
        schedule_destroy_timer(room);
    end
end);

-- forward visitor presences to jicofo
-- detects raise hand in visitors presence, this is request for promotion
-- detects the requested transcription and its language to send updates for it
module:hook('muc-broadcast-presence', function (event)
    local occupant = event.occupant;

    ---- we are interested only of visitors presence to send it to jicofo
    if occupant.role ~= 'visitor' then
        return;
    end

    local room = event.room;
    local focus_occupant = get_focus_occupant(room);

    if not focus_occupant then
        return;
    end

    local actor, base_presence, nick, reason, x = event.actor, event.stanza, event.nick, event.reason, event.x;
    local actor_nick;
    if actor then
        actor_nick = jid.resource(room:get_occupant_jid(actor));
    end

    -- create a presence to send it to jicofo, as jicofo is special :)
    local full_x = st.clone(x.full or x);

    room:build_item_list(occupant, full_x, false, nick, actor_nick, actor, reason);
    local full_p = st.clone(base_presence):add_child(full_x);
    full_p.attr.to = focus_occupant.jid;
    room:route_to_occupant(focus_occupant, full_p);

    local raiseHand = full_p:get_child_text(PARTICIPANT_PROP_RAISE_HAND);
    -- a promotion detected let's send it to main prosody
    if raiseHand then
        local user_id;
        local is_moderator;
        local session = sessions[occupant.jid];
        local identity = session and session.jitsi_meet_context_user;

        if is_vpaas(room) and identity then
            -- in case of moderator in vpaas meeting we want to do auto-promotion
            local is_vpaas_moderator = identity.moderator;
            if is_vpaas_moderator == 'true' or is_vpaas_moderator == true then
                is_moderator = true;
            end
        else
            -- The case with single moderator in the room, we want to report our id
            -- so we can be auto promoted
            if identity and identity.id then
                user_id = session.jitsi_meet_context_user.id;

                if room._data.moderator_id then
                    if room._data.moderator_id == user_id then
                        is_moderator = true;
                    end
                elseif session.auth_token and auto_promoted_with_token then
                    -- non-vpaas and having a token is considered a moderator
                    is_moderator = true;
                end
            end
        end

        local iq_id = new_id();
        sent_iq_cache:set(iq_id, socket.gettime());
        local promotion_request = st.iq({
            type = 'set',
            to = 'visitors.'..main_domain,
            from = local_domain,
            id = iq_id })
          :tag('visitors', { xmlns = 'jitsi:visitors',
                             room = jid.join(jid.node(room.jid), muc_domain_prefix..'.'..main_domain) })
          :tag('promotion-request', {
            xmlns = 'jitsi:visitors',
            jid = occupant.jid,
            time = raiseHand,
            userId = user_id,
            forcePromote = is_moderator and 'true' or 'false';
          }):up();

        local nick_element = occupant:get_presence():get_child('nick', NICK_NS);
        if nick_element then
            promotion_request:add_child(nick_element);
        end

        module:send(promotion_request);
    end

    local requestTranscriptionValue = full_p:get_child_text(PARTICIPANT_PROP_REQUEST_TRANSCRIPTION);
    local hasTranscriptionEnabled = room._transcription_languages and room._transcription_languages[occupant.jid];

    -- detect transcription
    if requestTranscriptionValue == 'true' then
        local lang = full_p:get_child_text(PARTICIPANT_PROP_TRANSLATION_LANG);

        add_transcription(room, occupant, lang);
    elseif hasTranscriptionEnabled then
        remove_transcription(room, occupant, nil);
    end

    return;
end);

-- listens for responses to the iq sent for requesting promotion and forward it to the visitor
local function stanza_handler(event)
    local origin, stanza = event.origin, event.stanza;

    if stanza.name ~= 'iq' then
        return;
    end

    if stanza.attr.type == 'result' and sent_iq_cache:get(stanza.attr.id) then
        sent_iq_cache:set(stanza.attr.id, nil);
        return true;
    end

    if stanza.attr.type ~= 'set' then
        return;
    end

    local visitors_iq = event.stanza:get_child('visitors', 'jitsi:visitors');
    if not visitors_iq then
        return;
    end

    if stanza.attr.from ~= 'visitors.'..main_domain then
        module:log('warn', 'not from visitors component, ignore! %s', stanza);
        return true;
    end

    local room_jid = visitors_iq.attr.room;
    local room = get_room_from_jid(room_jid_match_rewrite(room_jid));

    if not room then
        module:log('warn', 'No room found %s in stanza_handler', room_jid);
        return;
    end

    local request_promotion = visitors_iq:get_child('promotion-response');
    if not request_promotion then
        return;
    end

    -- respond with successful receiving the iq
    respond_iq_result(origin, stanza);

    local req_jid = request_promotion.attr.jid;
    -- now let's find the occupant and forward the response
    local occupant = room:get_occupant_by_real_jid(req_jid);

    if occupant then
        stanza.attr.to = occupant.jid;
        stanza.attr.from = room.jid;
        room:route_to_occupant(occupant, stanza);
        return true;
    end
end

--process a host module directly if loaded or hooks to wait for its load
function process_host_module(name, callback)
    local function process_host(host)
        if host == name then
            callback(module:context(host), host);
        end
    end

    if prosody.hosts[name] == nil then
        module:log('debug', 'No host/component found, will wait for it: %s', name)

        -- when a host or component is added
        prosody.events.add_handler('host-activated', process_host);
    else
        process_host(name);
    end
end
-- if the message received ends with the main domain, these are system messages
-- for visitors, let's correct the room name there
local function message_handler(event)
    local origin, stanza = event.origin, event.stanza;

    if ends_with(stanza.attr.from, main_domain) then
        stanza.attr.from = stanza.attr.from:sub(1, -(main_domain:len() + 1))..local_domain;
    end
end

process_host_module(local_domain, function(host_module, host)
    host_module:hook('iq/host', stanza_handler, 10);
    host_module:hook('message/full', message_handler);
end);

-- only live chat is supported for visitors
module:hook('muc-occupant-groupchat', function(event)
    local occupant, room, stanza = event.occupant, event.room, event.stanza;
    local from = stanza.attr.from;
    local occupant_host;

    -- if there is no occupant this is a message from main, probably coming from other vnode
    if occupant then
        occupant_host = jid.host(occupant.bare_jid);

        -- we manage nick only for visitors
        if occupant_host ~= main_domain then
            -- add to message stanza display name for the visitor
            -- remove existing nick to avoid forgery
            stanza:remove_children('nick', NICK_NS);
            local nick_element = occupant:get_presence():get_child('nick', NICK_NS);
            if nick_element then
                stanza:add_child(nick_element);
            else
                stanza:tag('nick', { xmlns = NICK_NS })
                    :text('anonymous'):up();
            end
        end

        stanza.attr.from = occupant.nick;
    else
        stanza.attr.from = jid.join(jid.node(from), module.host);
    end

    -- let's send it to main chat and rest of visitors here
    for _, o in room:each_occupant() do
        -- filter remote occupants
        if jid.host(o.bare_jid) == local_domain then
            room:route_to_occupant(o, stanza)
        end
    end

    -- send to main participants only messages from local occupants (skip from remote vnodes)
    if occupant and occupant_host == local_domain then
        local main_message = st.clone(stanza);
        main_message.attr.to = jid.join(jid.node(room.jid), muc_domain_prefix..'.'..main_domain);
        -- make sure we fix the from to be the real jid
        main_message.attr.from = room_jid_match_rewrite(stanza.attr.from);
        module:send(main_message);
    end
    stanza.attr.from = from; -- something prosody does internally

    return true;
end, 55); -- prosody check for visitor's chat is prio 50, we want to override it

module:hook('muc-private-message', function(event)
    -- private messaging is forbidden
    event.origin.send(st.error_reply(event.stanza, 'auth', 'forbidden',
            'Private messaging is disabled on visitor nodes'));
    return true;
end, 10);

-- we calculate the stats on the configured interval (60 seconds by default)
module:hook_global('stats-update', function ()
    local participants_count, rooms_count, visitors_count = 0, 0, 0;

    -- iterate over all rooms
    for room in prosody.hosts[module.host].modules.muc.each_room() do
        rooms_count = rooms_count + 1;
        for _, o in room:each_occupant() do
            if not is_admin(o.bare_jid) then
                local _, host = jid.split(o.bare_jid);
                if prosody.hosts[host] then -- local hosts are visitors (including jigasi)
                    visitors_count = visitors_count + 1;
                else
                    participants_count = participants_count + 1;
                end
            end
        end
    end

    measure_rooms(rooms_count);
    measure_visitors(visitors_count);
    measure_participants(participants_count);
end);

-- we skip it till the main participants are added from the main prosody
module:hook('jicofo-unlock-room', function(e)
    -- we do not block events we fired
    if e.fmuc_fired then
        return;
    end

    return true;
end);

-- handles incoming iq visitors stanzas
-- connect - sent after sending all main participant's presences
-- disconnect - sent when main room is destroyed or when we receive a 'disconnect-vnode' iq from jicofo
-- update - sent on:
--      * room secret is changed
--      * lobby enabled or disabled
--      * initially before connect to report currently joined moderators
--      * moderator participant joins main room
--      * a participant has been granted moderator rights
local function iq_from_main_handler(event)
    local origin, stanza = event.origin, event.stanza;

    if stanza.name ~= 'iq' then
        return;
    end

    if stanza.attr.type == 'result' and sent_iq_cache:get(stanza.attr.id) then
        sent_iq_cache:set(stanza.attr.id, nil);
        return true;
    end

    if stanza.attr.type ~= 'set' then
        return;
    end

    local visitors_iq = event.stanza:get_child('visitors', 'jitsi:visitors');
    if not visitors_iq then
        return;
    end

    if stanza.attr.from ~= main_domain then
        module:log('warn', 'not from main prosody, ignore! %s', stanza);
        return true;
    end

    local room_jid = visitors_iq.attr.room;
    local room = get_room_from_jid(room_jid_match_rewrite(room_jid));

    if not room then
        module:log('warn', 'No room found %s in iq_from_main_handler for:%s', room_jid, visitors_iq);
        return;
    end

    local node = visitors_iq:get_child('connect');
    local fire_jicofo_unlock = true;
    local process_disconnect = false;

    if not node then
        node = visitors_iq:get_child('update');
        fire_jicofo_unlock = false;
    end

    if not node then
        node = visitors_iq:get_child('disconnect');
        process_disconnect = true;
    end

    if not node then
        return;
    end

    -- respond with successful receiving the iq
    respond_iq_result(origin, stanza);

    if process_disconnect then
        cancel_destroy_timer(room);

        local main_count, visitors_count = get_occupant_counts(room);
        module:log('info', 'Will destroy:%s main_occupants:%s visitors:%s', room.jid, main_count, visitors_count);
        room:destroy(nil, 'Conference ended.');
        return true;
    end

    -- if there is password supplied use it
    -- if this is update it will either set or remove the password
    room:set_password(node.attr.password);
    room._data.meetingId = node.attr.meetingId;
    room._data.moderator_id = node.attr.moderatorId;
    local createdTimestamp = node.attr.createdTimestamp;
    room.created_timestamp = createdTimestamp and tonumber(createdTimestamp) or nil;

    if node.attr.lobby == 'true' then
        room._main_room_lobby_enabled = true;
    elseif node.attr.lobby == 'false' then
        room._main_room_lobby_enabled = false;
    end

    -- read the moderators list
    room.moderators_list = room.moderators_list or set.new();
    local moderators = node:get_child('moderators');

    if moderators then
        for _, child in ipairs(moderators.tags) do
            if child.name == 'item' then
                room.moderators_list:add(child.attr.epId);
            end
        end

        -- let's check current occupants roles and promote them if needed
        -- we change only main participants which are not moderators, but participant
        for _, o in room:each_occupant() do
            if not is_admin(o.bare_jid)
                and o.role == 'participant'
                and room.moderators_list:contains(jid.resource(o.nick)) then
                room:set_affiliation(true, o.bare_jid, 'owner');
            end
        end
    end

    if fire_jicofo_unlock then
        -- everything is connected allow participants to join
        module:fire_event('jicofo-unlock-room', { room = room; fmuc_fired = true; });
    end

    return true;
end
module:hook('iq/host', iq_from_main_handler, 10);

-- Filters presences (if detected) that are with destination the main prosody
function filter_stanza(stanza, session)
    if (stanza.name == 'presence' or stanza.name == 'message') and session.type ~= 'c2s' then
        -- we clone it so we do not affect broadcast using same stanza, sending it to clients
        local f_st = st.clone(stanza);
        f_st.skipMapping = true;
        return f_st;
    elseif stanza.name == 'presence' and session.type == 'c2s' and jid.node(stanza.attr.to) == 'focus' then
        local x = stanza:get_child('x', 'http://jabber.org/protocol/muc#user');
        if presence_check_status(x, '110') then
            return stanza; -- no filter
        end

        -- we want to filter presences to jicofo for the main participants, skipping visitors
        -- no point of having them, but if it is the one of the first to be sent
        -- when first visitor is joining can produce the 'No hosts[from_host]' error as we
        -- rewrite the from, but we need to not do it to be able to filter it later for the s2s
        if jid.host(room_jid_match_rewrite(stanza.attr.from)) ~= local_muc_domain then
            return nil; -- returning nil filters the stanza
        end
    end
    return stanza; -- no filter
end
function filter_session(session)
    -- domain mapper is filtering on default priority 0, and we need it before that
    filters.add_filter(session, 'stanzas/out', filter_stanza, 2);
end

filters.add_filter_hook(filter_session);

function route_s2s_stanza(event)
    local from_host, to_host, stanza = event.from_host, event.to_host, event.stanza;

    if to_host ~= main_domain then
        return; -- continue with hook listeners
    end

     if stanza.name == 'message' then
        if jid.resource(stanza.attr.to) then
            -- there is no point of delivering messages to main participants individually
            return true; -- drop it
        end
        return;
     end

     if stanza.name == 'presence' then
        -- we want to leave only unavailable presences to go to main node
        -- all other presences from jicofo or the main participants there is no point to go to the main node
        -- they are anyway not handled
        if stanza.attr.type ~= 'unavailable' then
            return true; -- drop it
        end
        return;
     end
end

-- routing to sessions in mod_s2s is -1 and -10, we want to hook before that to make sure to is correct
-- or if we want to filter that stanza
module:hook("route/remote", route_s2s_stanza, 10);
