module:log('info', 'Starting visitors_component at %s', module.host);

local array = require "util.array";
local http = require 'net.http';
local jid = require 'util.jid';
local st = require 'util.stanza';
local util = module:require 'util';
local is_admin = util.is_admin;
local is_healthcheck_room = util.is_healthcheck_room;
local is_sip_jigasi = util.is_sip_jigasi;
local room_jid_match_rewrite = util.room_jid_match_rewrite;
local get_room_from_jid = util.get_room_from_jid;
local get_focus_occupant = util.get_focus_occupant;
local get_room_by_name_and_subdomain = util.get_room_by_name_and_subdomain;
local internal_room_jid_match_rewrite = util.internal_room_jid_match_rewrite;
local table_find = util.table_find;
local is_vpaas = util.is_vpaas;
local is_sip_jibri_join = util.is_sip_jibri_join;
local process_host_module = util.process_host_module;
local respond_iq_result = util.respond_iq_result;
local split_string = util.split_string;
local new_id = require 'util.id'.medium;
local json = require 'cjson.safe';
local inspect = require 'inspect';

-- will be initialized once the main virtual host module is initialized
local token_util;

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

-- whether to always advertise that visitors feature is enabled for rooms
-- can be set to off and being controlled by another module, turning it on and off for rooms
local always_visitors_enabled = module:get_option_boolean('always_visitors_enabled', true);

local visitors_queue_service = module:get_option_string('visitors_queue_service');
local http_headers = {
    ["User-Agent"] = "Prosody (" .. prosody.version .. "; " .. prosody.platform .. ")",
    ["Content-Type"] = "application/json",
    ["Accept"] = "application/json"
};

-- This is a map to keep data for room and the jids that were allowed to join after visitor mode is enabled
-- automatically allowed or allowed by a moderator
local visitors_promotion_map = {};

-- A map with key room jid. The content is a map with key jid from which the request is received
-- and the value is a table that has the json message that needs to be sent to any future moderator that joins
-- and the vnode from which the request is received and where the response will be sent
local visitors_promotion_requests = {};

local cache = require 'util.cache';
local sent_iq_cache = cache.new(200);

-- Sends a json-message to the destination jid
-- @param to_jid the destination jid
-- @param json_message the message content to send
function send_json_message(to_jid, json_message)
    local stanza = st.message({ from = module.host; to = to_jid; })
         :tag('json-message', { xmlns = 'http://jitsi.org/jitmeet' }):text(json_message):up();
    module:send(stanza);
end

local function request_promotion_received(room, from_jid, from_vnode, nick, time, user_id, group_id, force_promote_requested)
    -- if visitors is enabled for the room
    if visitors_promotion_map[room.jid] then
        local force_promote = auto_allow_promotion;
        if not force_promote and force_promote_requested == 'true' then
            -- Let's do the force_promote checks if requested
            -- if it is vpaas meeting we trust the moderator computation from visitor node (value of force_promote_requested)
            -- if it is not vpaas we need to check further settings only if they exist
            if is_vpaas(room) or (not room._data.moderator_id and not room._data.moderators)
                -- _data.moderator_id can be used from external modules to set single moderator for a meeting
                -- or a whole group of moderators
                or (room._data.moderator_id
                    and room._data.moderator_id == user_id or room._data.moderator_id == group_id)

                -- all moderators are allowed to auto promote, the fact that user_id and force_promote_requested are set
                -- means that the user has token and is moderator on visitor node side
                or room._data.allModerators

                -- can be used by external modules to set multiple moderator ids (table of values)
                or table_find(room._data.moderators, user_id)
            then
                force_promote = true;
            end
        end

        -- only for raise hand, ignore lowering the hand
        if time and time > 0 and force_promote then
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

            local node = jid.node(room.jid);

            module:send(st.iq({
                    type='set', to = req_from, from = module.host, id = iq_id })
                :tag('visitors', {
                    xmlns='jitsi:visitors',
                    room = jid.join(node, muc_domain_prefix..'.'..req_from),
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

            local msg_to_send, error = json.encode(body_json);

            if not msg_to_send then
                module:log('error', 'Error encoding msg room:%s error:%s', room.jid, error)
                return true;
            end

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

    room._connected_vnodes:set(vnode..'.meet.jitsi', {});
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

-- returns the accumulated data for visitors nodes, count all visitors requesting transcriptions
-- and accumulated languages requested
-- @returns count, languages
function get_visitors_languages(room)
    if not room._connected_vnodes then
        return;
    end

    local count = 0;
    local languages = array();

    -- iterate over visitor nodes we are connected to and accumulate data if we have it
    for k, v in room._connected_vnodes:items() do
        if v.count then
            count = count + v.count;
        end
        if v.langs then
            for k in pairs(v.langs) do
                local val = v.langs[k]
                if not languages[val] then
                    languages:push(val);
                end
            end
        end
    end
    return count, languages:sort():concat(',');
end

local function get_visitors_room_metadata(room)
    if not room.jitsiMetadata then
        room.jitsiMetadata = {};
    end
    if not room.jitsiMetadata.visitors then
        room.jitsiMetadata.visitors = {};
    end
    return room.jitsiMetadata.visitors;
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
        return true;
    end

    local from_vnode;
    if room._connected_vnodes then
        from_vnode = room._connected_vnodes:get(stanza.attr.from);
    end

    local processed;
    -- promotion request is coming from visitors and is a set and is over the s2s connection
    local request_promotion = visitors_iq:get_child('promotion-request');
    if request_promotion then
        if not from_vnode then
            module:log('warn', 'Received forged request_promotion message: %s %s',stanza, inspect(room._connected_vnodes));
            return true; -- stop processing
        end

        local display_name = visitors_iq:get_child_text('nick', 'http://jabber.org/protocol/nick');
        processed = request_promotion_received(
            room,
            request_promotion.attr.jid,
            stanza.attr.from,
            display_name,
            tonumber(request_promotion.attr.time),
            request_promotion.attr.userId,
            request_promotion.attr.groupId,
            request_promotion.attr.forcePromote
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

    -- request to update metadata service for jigasi languages
    local transcription_languages = visitors_iq:get_child('transcription-languages');

    if transcription_languages
        and (transcription_languages.attr.langs or transcription_languages.attr.count) then
        if not from_vnode then
            module:log('warn', 'Received forged transcription_languages message: %s %s',stanza, inspect(room._connected_vnodes));
            return true; -- stop processing
        end

        local metadata = get_visitors_room_metadata(room);

        -- we keep the split by languages array to optimize accumulating languages
        from_vnode.langs = split_string(transcription_languages.attr.langs, ',');
        from_vnode.count = transcription_languages.attr.count;

        local count, languages = get_visitors_languages(room);

        if metadata.transcribingLanguages ~= languages then
            metadata.transcribingLanguages = languages;
            processed = true;
        end

        if metadata.transcribingCount ~= count then
            metadata.transcribingCount = count;
            processed = true;
        end

        if processed then
            module:context(muc_domain_prefix..'.'..muc_domain_base)
                :fire_event('room-metadata-changed', { room = room; });
        end
    end

    if not processed then
        module:log('warn', 'Unknown iq received for %s: %s', module.host, stanza);
    end

    respond_iq_result(origin, stanza);
    return processed;
end

local function process_promotion_response(room, id, approved)
    if not approved then
        module:log('debug', 'promotion not approved %s, %s', room.jid, id);
        return;
    end

    -- lets reply to participant that requested promotion
    local username = new_id():lower();
    visitors_promotion_map[room.jid][username] = {
        from = visitors_promotion_requests[room.jid][id].from;
        jid = id;
    };

    local req_from = visitors_promotion_map[room.jid][username].from;
    local req_jid = visitors_promotion_map[room.jid][username].jid;
    local focus_occupant = get_focus_occupant(room);
    local focus_jid = focus_occupant and focus_occupant.bare_jid or nil;

    local iq_id = new_id();
    sent_iq_cache:set(iq_id, socket.gettime());

    local node = jid.node(room.jid);

    module:send(st.iq({
            type='set', to = req_from, from = module.host, id = iq_id })
        :tag('visitors', {
            xmlns='jitsi:visitors',
            room = jid.join(node, muc_domain_prefix..'.'..req_from),
            focusjid = focus_jid })
         :tag('promotion-response', {
            xmlns='jitsi:visitors',
            jid = req_jid,
            username = username,
            allow = approved }):up());
end

-- if room metadata does not have visitors.live set to `true` and there are no occupants in the meeting
-- it will skip calling goLive endpoint
local function go_live(room)
    if room._jitsi_go_live_sent then
        return;
    end

    -- if missing we assume room is live, only skip if it is marked explicitly as false
    if room.jitsiMetadata and room.jitsiMetadata.visitors
            and room.jitsiMetadata.visitors.live ~= nil and room.jitsiMetadata.visitors.live == false then
        return;
    end

    local has_occupant = false;
    for _, occupant in room:each_occupant() do
        if not is_admin(occupant.bare_jid) then
            has_occupant = true;
            break;
        end
    end

    -- when there is an occupant then go live
    if not has_occupant then
        return;
    end

    -- let's inform the queue service
    local function cb(content_, code_, response_, request_)
        local room = room;
        if code_ ~= 200 then
            module:log('warn', 'External call to visitors_queue_service/golive failed. Code %s, Content %s',
                code_, content_)
        end
    end

    local headers = http_headers or {};
    headers['Authorization'] = token_util:generateAsapToken();

    local ev = {
        conference = internal_room_jid_match_rewrite(room.jid)
    };

    room._jitsi_go_live_sent = true;

    http.request(visitors_queue_service..'/golive', {
        headers = headers,
        method = 'POST',
        body = json.encode(ev);
    }, cb);
end

module:hook('iq/host', stanza_handler, 10);

process_host_module(muc_domain_base, function(host_module, host)
    token_util = module:require "token/util".new(host_module);
end);

process_host_module(muc_domain_prefix..'.'..muc_domain_base, function(host_module, host)
    -- if visitor mode is started, then you are not allowed to join without request/response exchange of iqs -> deny access
    -- check list of allowed jids for the room
    host_module:hook('muc-occupant-pre-join', function (event)
        local room, stanza, occupant, session = event.room, event.stanza, event.occupant, event.origin;

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
            or is_sip_jigasi(stanza)
            or is_sip_jibri_join(stanza) then
            return;
        end

        if visitors_promotion_map[room.jid] then
            local in_ignore_list = ignore_list:contains(jid.host(stanza.attr.from));

            -- now let's check for jid
            if visitors_promotion_map[room.jid][jid.node(stanza.attr.from)] -- promotion was approved
                or in_ignore_list then -- jibri or other domains to ignore
                -- allow join
                if not in_ignore_list then
                    -- let's update metadata
                    local metadata = get_visitors_room_metadata(room);
                    if not metadata.promoted then
                        metadata.promoted = {};
                    end
                    metadata.promoted[jid.resource(occupant.nick)] = true;
                    module:context(muc_domain_prefix..'.'..muc_domain_base)
                        :fire_event('room-metadata-changed', { room = room; });
                end

                return;
            end
            module:log('error', 'Visitor needs to be allowed by a moderator %s', stanza.attr.from);
            session.send(st.error_reply(stanza, 'cancel', 'not-allowed', 'Visitor needs to be allowed by a moderator')
                :tag('promotion-not-allowed', { xmlns = 'jitsi:visitors' }));
            return true;
        elseif is_vpaas(room) then
            -- special case for vpaas where if someone with a visitor token tries to join a room, where
            -- there are no visitors yet, we deny access
            if session.jitsi_meet_context_user and session.jitsi_meet_context_user.role == 'visitor' then
                session.log('warn', 'Deny user join as visitor in the main meeting, not approved');
                session.send(st.error_reply(
                    stanza, 'cancel', 'not-allowed', 'Visitor tried to join the main room without approval')
                        :tag('no-main-participants', { xmlns = 'jitsi:visitors' }));
                return true;
            end
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

    host_module:hook('jitsi-endpoint-message-received', function(event)
        local data, error, occupant, room, stanza
            = event.message, event.error, event.occupant, event.room, event.stanza;

        if not data or data.type ~= 'visitors'
            or (data.action ~= "promotion-response" and data.action ~= "demote-request") then
            if error then
                module:log('error', 'Error decoding error:%s', error);
            end
            return;
        end

        if occupant.role ~= 'moderator' then
            module:log('error', 'Occupant %s sending response message but not moderator in room %s',
                occupant.jid, room.jid);
            return false;
        end

        if data.action == "demote-request" then
            if occupant.nick ~= room.jid..'/'..data.actor then
                module:log('error', 'Bad actor in demote request %s', stanza);
                event.origin.send(st.error_reply(stanza, "cancel", "bad-request"));
                return true;
            end

            -- when demoting we want to send message to the demoted participant and to moderators
            local target_jid = room.jid..'/'..data.id;
            stanza.attr.type = 'chat'; -- it is safe as we are not using this stanza instance anymore
            stanza.attr.from = module.host;

            for _, room_occupant in room:each_occupant() do
                -- do not send it to jicofo or back to the sender
                if room_occupant.jid ~= occupant.jid and not is_admin(room_occupant.bare_jid) then
                    if room_occupant.role == 'moderator'
                        or room_occupant.nick == target_jid then
                        stanza.attr.to = room_occupant.jid;
                        room:route_stanza(stanza);
                    end
                end
            end
        else
            if data.id then
                process_promotion_response(room, data.id, data.approved and 'true' or 'false');
            else
                -- we are in the case with admit all, we need to read data.ids
                for _,value in pairs(data.ids) do
                    process_promotion_response(room, value, data.approved and 'true' or 'false');
                end
            end
        end

        return true; -- halt processing, but return true that we handled it
    end);

    if visitors_queue_service then
        host_module:hook('muc-room-created', function (event)
            local room = event.room;

            if is_healthcheck_room(room.jid) then
                return;
            end

            go_live(room);
        end, -2); -- metadata hook on -1
        host_module:hook('jitsi-metadata-updated', function (event)
            if event.key == 'visitors' then
                go_live(event.room);
            end
        end);
        -- when metadata changed internally from another module
        host_module:hook('room-metadata-changed', function (event)
            go_live(event.room);
        end);
        host_module:hook('muc-occupant-joined', function (event)
            local room = event.room;

            if is_healthcheck_room(room.jid) then
                return;
            end

            go_live(room);
        end);
    end

    if always_visitors_enabled then
        local visitorsEnabledField = {
            name = "muc#roominfo_visitorsEnabled";
            type = "boolean";
            label = "Whether visitors are enabled.";
            value = 1;
        };
        -- Append "visitors enabled" to the MUC config form.
        host_module:context(host):hook("muc-disco#info", function(event)
            table.insert(event.form, visitorsEnabledField);
        end);
        host_module:context(host):hook("muc-config-form", function(event)
            table.insert(event.form, visitorsEnabledField);
        end);
    end
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

-- when occupant is leaving breakout to join the main room and visitors are enabled
-- make sure we will allow that participant to join as it is already part of the main room
function handle_occupant_leaving_breakout(event)
    local main_room, occupant, stanza = event.main_room, event.occupant, event.stanza;
    local presence_status = stanza:get_child_text('status');

    if presence_status ~= 'switch_room' or not visitors_promotion_map[main_room.jid] then
        return;
    end

    local node = jid.node(occupant.bare_jid);

    visitors_promotion_map[main_room.jid][node] = {
        from = 'none';
        jid = occupant.bare_jid;
    };
end
module:hook_global('jitsi-breakout-occupant-leaving', handle_occupant_leaving_breakout);
