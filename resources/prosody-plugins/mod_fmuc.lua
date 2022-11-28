--- activate under main muc component
--- Add the following config under the main muc component
---  muc_room_default_presence_broadcast = {
---        visitor = false;
---        participant = true;
---        moderator = true;
---    };
--- Enable in global modules: 's2s_bidi'
--- Make sure 's2s' is not in modules_disabled
--- TODO: Do we need the /etc/hosts changes? We can drop it for https://modules.prosody.im/mod_s2soutinjection.html
--- In /etc/hosts add:
--- vmmain-ip-address focus.domain.com
--- vmmain-ip-address conference.domain.com
--- vmmain-ip-address domain.com
--- Open port 5269 on the provider side and on the firewall of the machine, so the core node can access this visitor one
local jid = require 'util.jid';
local st = require 'util.stanza';

local muc_domain_prefix = module:get_option_string('muc_mapper_domain_prefix', 'conference');
local main_domain = string.gsub(module.host, muc_domain_prefix..'.', '');

local function get_focus_occupant(room)
    local focus_occupant = room._data.focus_occupant;

    if focus_occupant then
        return focus_occupant;
    end

    for _, n_occupant in room:each_occupant() do
        if jid.node(n_occupant.jid) == 'focus' then
            room._data.focus_occupant = n_occupant;
            return n_occupant;
        end
    end

    return nil;
end

-- mark all occupants as visitors
module:hook('muc-occupant-pre-join', function (event)
    local occupant = event.occupant;

    if jid.host(occupant.bare_jid) == main_domain then
        occupant.role = 'visitor';
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
        local pr = st.presence({ to = focus_occupant.jid, from = occupant.nick, type = 'unavailable' })
                     :tag('x', { xmlns = 'http://jabber.org/protocol/muc#user' })
                     :tag('item', {
            affiliation = room:get_affiliation(occupant.bare_jid) or 'none';
            role = 'none';
            nick = event.nick;
            jid = occupant.bare_jid }):up()
                :up();
        room:route_stanza(pr);
    end

    if not room.destroying then
        if room.xxl_destroy_timer then
            room.xxl_destroy_timer:stop();
        end

        room.xxl_destroy_timer = module:add_timer(15, function()
            -- let's check are all visitors in the room, if all a visitors - destroy it
            -- if all are main-participants also destroy it
            local main_count = 0;
            local visitors_count = 0;

            for _, o in room:each_occupant() do
                -- if there are visitor and main participant there is no point continue
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
    return;
end);
