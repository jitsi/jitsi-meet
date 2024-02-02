module:log('info', 'Starting visitors_component at %s', module.host);

local jid = require 'util.jid';
local st = require 'util.stanza';
local util = module:require 'util';
local is_healthcheck_room = util.is_healthcheck_room;
local room_jid_match_rewrite = util.room_jid_match_rewrite;
local get_room_from_jid = util.get_room_from_jid;
local get_focus_occupant = util.get_focus_occupant;
local get_room_by_name_and_subdomain = util.get_room_by_name_and_subdomain;
local internal_room_jid_match_rewrite = util.internal_room_jid_match_rewrite;
local is_vpaas = util.is_vpaas;
local is_sip_jibri_join = util.is_sip_jibri_join;
local new_id = require 'util.id'.medium;
local um_is_admin = require 'core.usermanager'.is_admin;
local json = require 'util.json';

local MUC_NS = 'http://jabber.org/protocol/muc';

local muc_domain_prefix = module:get_option_string('muc_mapper_domain_prefix', 'conference');
local muc_domain_base = module:get_option_string('muc_mapper_domain_base');
if not muc_domain_base then
    module:log('warn', 'No muc_domain_base option set.');
    return;
end

-- A list of domains which to be ignored for visitors. The config is set under the main virtual host
local ignore_list = module:context(muc_domain_base):get_option_set('visitors_ignore_list', {});

local auto_allow_promotion = module:get_option_boolean('auto_allow_visitor_promotion', false);

local function is_admin(jid)
    return um_is_admin(jid, module.host);
end

-- This is a map to keep data for room and the jids that were allowed to join after visitor mode is enabled
-- automatically allowed or allowed by a moderator
local visitors_promotion_map = {};

-- A map with key room jid. The content is a map with key jid from which the request is received
-- and the value is a table that has the json message that needs to be sent to any future moderator that joins
-- and the vnode from which the request is received and where the response will be sent
local visitors_promotion_requests = {};

local cache = require 'util.cache';
local sent_iq_cache = cache.new(200);

-- send iq result that the iq was received and will be processed
local function respond_iq_result(origin, stanza)
    -- respond with successful receiving the iq
    origin.send(st.iq({
        type = 'result';
        from = stanza.attr.to;
        to = stanza.attr.from;
        id = stanza.attr.id
    }));
end

-- Sends a json-message to the destination jid
-- @param to_jid the destination jid
-- @param json_message the message content to send
function send_json_message(to_jid, json_message)
    local stanza = st.message({ from = module.host; to = to_jid; })
         :tag('json-message', { xmlns = 'http://jitsi.org/jitmeet' }):text(json_message):up();
    module:send(stanza);
end

local function request_promotion_received(room, from_jid, from_vnode, nick, time, user_id, force_promote)
    -- if visitors is enabled for the room
    if visitors_promotion_map[room.jid] then
        -- only for raise hand, ignore lowering the hand
        if time and time > 0 and (
            auto_allow_promotion
            or (user_id and user_id == room._data.moderator_id)
            or force_promote == 'true') then
            --  we are in auto-allow mode, let's reply with accept
            -- we store where the request is coming from so we can send back the response
            local username = new_id():lower();
            visitors_promotion_map[room.jid][username] = {
                from = from_vnode;
                jid = from_jid;
            };

            local req_from = visitors_promotion_map[room.jid][username].from;
            local req_jid = visitors_promotion_map[room.jid][username].jid;
            local focus_occupant = get_focus_occupant(room);
            local focus_jid = focus_occupant and focus_occupant.bare_jid or nil;

            local iq_id = new_id();
            sent_iq_cache:set(iq_id, socket.gettime());

            module:send(st.iq({
                    type='set', to = req_from, from = module.host, id = iq_id })
                :tag('visitors', {
                    xmlns='jitsi:visitors',
                    room = string.gsub(room.jid, muc_domain_base, req_from),
                    focusjid = focus_jid })
                 :tag('promotion-response', {
                    xmlns='jitsi:visitors',
                    jid = req_jid,
                    username = username ,
                    allow = 'true' }):up());
            return true;
        else
            -- send promotion request to all moderators
            local body_json = {};
            body_json.type = 'visitors';
            body_json.room = internal_room_jid_match_rewrite(room.jid);
            body_json.action = 'promotion-request';
            body_json.nick = nick;
            body_json.from = from_jid;

            if time and time > 0 then
                -- raise hand
                body_json.on = true;
            else
                -- lower hand, we want to inform interested parties that
                -- the visitor is no longer interested in joining the main call
                body_json.on = false;
            end

            local msg_to_send = json.encode(body_json);
            if visitors_promotion_requests[room.jid] then
                visitors_promotion_requests[room.jid][from_jid] = {
                    msg = msg_to_send;
                    from = from_vnode;
                };
            else
                module:log('warn', 'Received promotion request for room %s with visitors not enabled. %s',
                    room.jid, msg_to_send);
            end

            -- let's send a notification to every moderator
            for _, occupant in room:each_occupant() do
                if occupant.role == 'moderator' and not is_admin(occupant.bare_jid) then
                    send_json_message(occupant.jid, msg_to_send);
                end
            end

            return true;
        end
    end

    module:log('warn', 'Received promotion request from %s for room %s without active visitors', from, room.jid);
end

local function connect_vnode_received(room, vnode)
    module:context(muc_domain_base):fire_event('jitsi-connect-vnode', { room = room; vnode = vnode; });

    if not visitors_promotion_map[room.jid] then
        -- visitors is enabled
        visitors_promotion_map[room.jid] = {};
        visitors_promotion_requests[room.jid] = {};
        room._connected_vnodes = cache.new(16); -- we up to 16 vnodes for this prosody
    end

    room._connected_vnodes:set(vnode..'.meet.jitsi', 'connected');
end

local function disconnect_vnode_received(room, vnode)
    module:context(muc_domain_base):fire_event('jitsi-disconnect-vnode', { room = room; vnode = vnode; });

    room._connected_vnodes:set(vnode..'.meet.jitsi', nil);

    if room._connected_vnodes:count() == 0 then
        visitors_promotion_map[room.jid] = nil;
        visitors_promotion_requests[room.jid] = nil;
        room._connected_vnodes = nil;
    end
end

-- listens for iq request for promotion and forward it to moderators in the meeting for approval
-- or auto-allow it if such the config is set enabling it
local function stanza_handler(event)
    local origin, stanza = event.origin, event.stanza;

    if stanza.name ~= 'iq' then
        return;
    end

    if stanza.attr.type == 'result' and sent_iq_cache:get(stanza.attr.id) then
        sent_iq_cache:set(stanza.attr.id, nil);
        return true;
    end

    if stanza.attr.type ~= 'set' and stanza.attr.type ~= 'get' then
        return; -- We do not want to reply to these, so leave.
    end

    local visitors_iq = event.stanza:get_child('visitors', 'jitsi:visitors');
    if not visitors_iq then
        return;
    end

    -- set stanzas are coming from s2s connection
    if stanza.attr.type == 'set' and origin.type ~= 's2sin' then
        module:log('warn', 'not from s2s session, ignore! %s', stanza);
        return true;
    end

    local room_jid = visitors_iq.attr.room;
    local room = get_room_from_jid(room_jid_match_rewrite(room_jid));

    if not room then
        -- this maybe as we receive the iq from jicofo after the room is already destroyed
        module:log('debug', 'No room found %s', room_jid);
        return;
    end

    local processed;
    -- promotion request is coming from visitors and is a set and is over the s2s connection
    local request_promotion = visitors_iq:get_child('promotion-request');
    if request_promotion then
        if not (room._connected_vnodes and room._connected_vnodes:get(stanza.attr.from)) then
            module:log('warn', 'Received forged promotion-request: %s %s %s', stanza, inspect(room._connected_vnodes), room._connected_vnodes:get(stanza.attr.from));
            return true; -- stop processing
        end

        local force_promote = request_promotion.attr.forcePromote;
        if force_promote == 'true' and not is_vpaas(room) then
            -- allow force promote only in case there are no moderators in the room
            for _, occupant in room:each_occupant() do
                if occupant.role == 'moderator' and not is_admin(occupant.bare_jid) then
                    force_promote = false;
                    break;
                end
            end
        end

        local display_name = visitors_iq:get_child_text('nick', 'http://jabber.org/protocol/nick');
        processed = request_promotion_received(
            room,
            request_promotion.attr.jid,
            stanza.attr.from,
            display_name,
            tonumber(request_promotion.attr.time),
            request_promotion.attr.userId,
            force_promote
        );
    end

    -- connect and disconnect are only received from jicofo
    if is_admin(jid.bare(stanza.attr.from)) then
        for item in visitors_iq:childtags('connect-vnode') do
            connect_vnode_received(room, item.attr.vnode);
            processed = true;
        end

        for item in visitors_iq:childtags('disconnect-vnode') do
            disconnect_vnode_received(room, item.attr.vnode);
            processed = true;
        end
    end

    if not processed then
        module:log('warn', 'Unknown iq received for %s: %s', module.host, stanza);
    end

    respond_iq_result(origin, stanza);
    return processed;
end

module:hook('iq/host', stanza_handler, 10);

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

process_host_module(muc_domain_prefix..'.'..muc_domain_base, function(host_module, host)
    -- if visitor mode is started, then you are not allowed to join without request/response exchange of iqs -> deny access
    -- check list of allowed jids for the room
    host_module:hook('muc-occupant-pre-join', function (event)
        local room, stanza, occupant, origin = event.room, event.stanza, event.occupant, event.origin;

        if is_healthcheck_room(room.jid) or is_admin(occupant.bare_jid) then
            return;
        end

        -- visitors were already in the room one way or another they have access
        -- skip password challenge
        local join = stanza:get_child('x', MUC_NS);
        if join and room:get_password() and
            visitors_promotion_map[room.jid] and visitors_promotion_map[room.jid][jid.node(stanza.attr.from)] then
            join:tag('password', { xmlns = MUC_NS }):text(room:get_password());
        end

        -- we skip any checks when auto-allow is enabled
        if auto_allow_promotion
            or ignore_list:contains(jid.host(stanza.attr.from)) -- jibri or other domains to ignore
            or stanza:get_child('initiator', 'http://jitsi.org/protocol/jigasi')
            or is_sip_jibri_join(stanza) then
            return;
        end

        if visitors_promotion_map[room.jid] then
            -- now let's check for jid
            if visitors_promotion_map[room.jid][jid.node(stanza.attr.from)] -- promotion was approved
                or ignore_list:contains(jid.host(stanza.attr.from)) then -- jibri or other domains to ignore
                -- allow join
                return;
            end

            origin.send(st.error_reply(stanza, 'cancel', 'not-allowed', 'Visitor needs to be allowed by a moderator'));
            return true;
        end

    end, 7); -- after muc_meeting_id, the logic for not joining before jicofo
    host_module:hook('muc-room-destroyed', function (event)
        visitors_promotion_map[event.room.jid] = nil;
        visitors_promotion_requests[event.room.jid] = nil;
    end);

    host_module:hook('muc-occupant-joined', function (event)
        local room, occupant = event.room, event.occupant;

        if is_healthcheck_room(room.jid) or is_admin(occupant.bare_jid) or occupant.role ~= 'moderator' -- luacheck: ignore
            or not visitors_promotion_requests[event.room.jid] then
            return;
        end

        for _,value in pairs(visitors_promotion_requests[event.room.jid]) do
            send_json_message(occupant.jid, value.msg);
        end
    end);
    host_module:hook('muc-set-affiliation', function (event)
        -- the actor can be nil if is coming from allowners or similar module we want to skip it here
        -- as we will handle it in occupant_joined
        local actor, affiliation, jid, room = event.actor, event.affiliation, event.jid, event.room;

        if is_admin(jid) or is_healthcheck_room(room.jid) or not actor or not affiliation == 'owner' -- luacheck: ignore
            or not visitors_promotion_requests[event.room.jid] then
            return;
        end

        -- event.jid is the bare jid of participant
        for _, occupant in room:each_occupant() do
            if occupant.bare_jid == event.jid then
                for _,value in pairs(visitors_promotion_requests[event.room.jid]) do
                    send_json_message(occupant.jid, value.msg);
                end
            end
        end
    end);
    host_module:hook("message/bare", function(event)
        local stanza = event.stanza;

        if stanza.attr.type ~= "groupchat" then
            return;
        end
        local json_data = stanza:get_child_text("json-message", "http://jitsi.org/jitmeet");
        if json_data == nil then
            return;
        end
        local data = json.decode(json_data);
        if not data or data.type ~= 'visitors' or data.action ~= "promotion-response" then
            return;
        end

        local room = get_room_from_jid(event.stanza.attr.to);

        local occupant_jid = event.stanza.attr.from;
        local occupant = room:get_occupant_by_real_jid(occupant_jid);
        if not occupant then
            module:log("error", "Occupant %s was not found in room %s", occupant_jid, room.jid)
            return
        end
        if occupant.role ~= 'moderator' then
            module:log('error', 'Occupant %s sending response message but not moderator in room %s',
                occupant_jid, room.jid);
            return false;
        end

        -- let's forward to every moderator, this is so they now that this moderator
        -- took action and they can update UI, as this msg was initially a group chat but we are
        -- sending it now as provide chat, let's change the type
        stanza.attr.type = 'chat'; -- it is safe as we are not using this stanza instance anymore
        for _, room_occupant in room:each_occupant() do
            -- if moderator send the message
            if room_occupant.role == 'moderator'
                and room_occupant.jid ~= occupant.jid
                and not is_admin(room_occupant.bare_jid) then
                stanza.attr.to = room_occupant.nick;
                room:route_stanza(stanza);
            end
        end

        -- lets reply to participant that requested promotion
        local username = new_id():lower();
        visitors_promotion_map[room.jid][username] = {
            from = visitors_promotion_requests[room.jid][data.id].from;
            jid = data.id;
        };

        local req_from = visitors_promotion_map[room.jid][username].from;
        local req_jid = visitors_promotion_map[room.jid][username].jid;
        local focus_occupant = get_focus_occupant(room);
        local focus_jid = focus_occupant and focus_occupant.bare_jid or nil;

        local iq_id = new_id();
        sent_iq_cache:set(iq_id, socket.gettime());

        module:send(st.iq({
                type='set', to = req_from, from = module.host, id = iq_id })
            :tag('visitors', {
                xmlns='jitsi:visitors',
                room = string.gsub(room.jid, muc_domain_base, req_from),
                focusjid = focus_jid })
             :tag('promotion-response', {
                xmlns='jitsi:visitors',
                jid = req_jid,
                username = username ,
                allow = data.approved and 'true' or 'false' }):up());
        return true; -- halt processing, but return true that we handled it
    end);
end);

prosody.events.add_handler('pre-jitsi-authentication', function(session)
    if not session.customusername or not session.jitsi_web_query_room then
        return nil;
    end

    local room = get_room_by_name_and_subdomain(session.jitsi_web_query_room, session.jitsi_web_query_prefix);
    if not room then
        return nil;
    end

    if visitors_promotion_map[room.jid] and visitors_promotion_map[room.jid][session.customusername] then
        -- user was previously allowed to join, let him use the requested jid
        return session.customusername;
    end
end);
