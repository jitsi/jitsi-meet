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
--- TODO: filter messages back to main prosody
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

-- This is the domain of the main prosody that is federating with us;
local fmuc_main_domain;

local sent_iq_cache = require 'util.cache'.new(200);

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

    if not room.destroying then
        if room.visitors_destroy_timer then
            room.visitors_destroy_timer:stop();
        end

        room.visitors_destroy_timer = module:add_timer(15, function()
            -- let's check are all visitors in the room, if all a visitors - destroy it
            -- if all are main-participants also destroy it
            local main_count = 0;
            local visitors_count = 0;

            for _, o in room:each_occupant() do
                -- if there are visitors and main participant there is no point continue
                if main_count > 0 and visitors_count > 0 then
                    return;
                end

                if o.role == 'visitor' then
                    visitors_count = visitors_count + 1;
                else
                    main_count = main_count + 1;
                end
            end

            if main_count == 0 then
                module:log('info', 'Will destroy:%s main_occupants:%s visitors:%s', room.jid, main_count, visitors_count);
                room:destroy(nil, 'No main participants.');
            elseif visitors_count == 0 then
                module:log('info', 'Will destroy:%s main_occupants:%s visitors:%s', room.jid, main_count, visitors_count);
                room:destroy(nil, 'No visitors.');
            end
        end);
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
        -- TODO check room= with tenants
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
        -- TODO what about name ???? it will be coming from the token, but we need to extract it and send it to the moderators
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
        log('warn', 'No room found %s', room_jid);
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
