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

local util = module:require 'util';
local room_jid_match_rewrite = util.room_jid_match_rewrite;
local get_room_from_jid = util.get_room_from_jid;
local get_focus_occupant = util.get_focus_occupant;
local internal_room_jid_match_rewrite = util.internal_room_jid_match_rewrite;

local muc_domain_prefix = module:get_option_string('muc_mapper_domain_prefix', 'conference');
local main_domain = string.gsub(module.host, muc_domain_prefix..'.', '');

local NICK_NS = 'http://jabber.org/protocol/nick';

-- we send stats for the total number of rooms, total number of participants and total number of visitors
local measure_rooms = module:measure("vnode-rooms", "amount");
local measure_participants = module:measure("vnode-participants", "amount");
local measure_visitors = module:measure("vnode-visitors", "amount");

-- This is the domain of the main prosody that is federating with us;
local fmuc_main_domain;

local sent_iq_cache = require 'util.cache'.new(200);

local um_is_admin = require 'core.usermanager'.is_admin;
local function is_admin(jid)
    return um_is_admin(jid, module.host);
end

-- mark all occupants as visitors
module:hook('muc-occupant-pre-join', function (event)
    local occupant, session = event.occupant, event.origin;
    local node, host = jid.split(occupant.bare_jid);

    if host == main_domain then
        occupant.role = 'visitor';
    elseif not fmuc_main_domain then
        if node ~= 'focus' then
            fmuc_main_domain = host;
        end
    end
end, 3);

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

    if occupant_domain == main_domain then
        local focus_occupant = get_focus_occupant(room);
        if not focus_occupant then
            module:log('warn', 'No focus found for %s', room.jid);
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

    if main_count == 0 then
        module:log('info', 'Will destroy:%s main_occupants:%s visitors:%s', room.jid, main_count, visitors_count);
        room:destroy(nil, 'No main participants.');
        return;
    end

    if visitors_count == 0 then
        schedule_destroy_timer(room);
    end
end);

-- forward visitor presences to jicofo
-- detects raise hand in visitors presence, this is request for promotion
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

    local raiseHand = full_p:get_child_text('jitsi_participant_raisedHand');
    -- a promotion detected let's send it to main prosody
    if raiseHand then
        local iq_id = new_id();
        sent_iq_cache:set(iq_id, socket.gettime());
        local promotion_request = st.iq({
            type = 'set',
            to = 'visitors.'..fmuc_main_domain,
            from = main_domain,
            id = iq_id })
          :tag('visitors', { xmlns = 'jitsi:visitors',
                             room = jid.join(jid.node(room.jid), muc_domain_prefix..'.'..fmuc_main_domain) })
          :tag('promotion-request', { xmlns = 'jitsi:visitors', jid = occupant.jid }):up();

        local nick_element = occupant:get_presence():get_child('nick', NICK_NS);
        if nick_element then
            promotion_request:add_child(nick_element);
        end

        module:send(promotion_request);
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

    if stanza.attr.from ~= 'visitors.'..fmuc_main_domain then
        module:log('warn', 'not from visitors component, ignore! %s %s', stanza.attr.from, stanza);
        return true;
    end

    local room_jid = visitors_iq.attr.room;
    local room = get_room_from_jid(room_jid_match_rewrite(room_jid));

    if not room then
        module:log('warn', 'No room found %s', room_jid);
        return;
    end

    local request_promotion = visitors_iq:get_child('promotion-response');
    if not request_promotion then
        return;
    end

    -- respond with successful receiving the iq
    origin.send(st.iq({
        type = "result";
        from = stanza.attr.to;
        to = stanza.attr.from;
        id = stanza.attr.id
    }));

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
process_host_module(main_domain, function(host_module, host)
    host_module:hook('iq/host', stanza_handler, 10);
end);

-- only live chat is supported for visitors
module:hook("muc-occupant-groupchat", function(event)
    local occupant, room, stanza = event.occupant, event.room, event.stanza;
    local from = stanza.attr.from;
    local occupant_host = jid.host(occupant.bare_jid);

    -- if there is no occupant this is a message from main, probably coming from other vnode
    if occupant then
        -- we manage nick only for visitors
        if occupant_host ~= fmuc_main_domain then
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
        if jid.host(o.bare_jid) == main_domain then
            room:route_to_occupant(o, stanza)
        end
    end

    -- send to main participants only messages from local occupants (skip from remote vnodes)
    if occupant and occupant_host ~= fmuc_main_domain then
        local main_message = st.clone(stanza);
        main_message.attr.to = jid.join(jid.node(room.jid), muc_domain_prefix..'.'..fmuc_main_domain);
        module:send(main_message);
    end
    stanza.attr.from = from; -- something prosody does internally

    return true;
end, 55); -- prosody check for visitor's chat is prio 50, we want to override it

module:hook('muc-private-message', function(event)
    -- private messaging is forbidden
    event.origin.send(st.error_reply(event.stanza, "auth", "forbidden",
            "Private messaging is disabled on visitor nodes"));
    return true;
end, 10);

-- we calculate the stats on the configured interval (60 seconds by default)
module:hook_global("stats-update", function ()
    local participants_count, rooms_count, visitors_count = 0, 0, 0;

    -- iterate over all rooms
    for room in prosody.hosts[module.host].modules.muc.each_room() do
        rooms_count = rooms_count + 1;
        for _, o in room:each_occupant() do
            if jid.host(o.bare_jid) == main_domain then
                visitors_count = visitors_count + 1;
            else
                participants_count = participants_count + 1;
            end
        end
        -- do not count jicofo
        participants_count = participants_count - 1;
    end

    measure_rooms(rooms_count);
    measure_visitors(visitors_count);
    measure_participants(participants_count);
end);


