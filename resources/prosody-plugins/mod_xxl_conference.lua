--- activate under main vhost
--- In /etc/hosts add:
--- vm1-ip-address visitors1.domain.com
--- vm1-ip-address conference.visitors1.domain.com
--- vm2-ip-address visitors2.domain.com
--- vm2-ip-address conference.visitors2.domain.com
--- TODO: drop the /etc/hosts changes for https://modules.prosody.im/mod_s2soutinjection.html
--- Enable in global modules: 's2s_bidi' and 'certs_all'
--- Make sure 's2s' is not in modules_disabled
--- Open port 5269 on the provider side and on the firewall on the machine (iptables -I INPUT 4 -p tcp -m tcp --dport 5269 -j ACCEPT)
--- TODO: make it work with tenants
local st = require 'util.stanza';
local jid = require 'util.jid';
local util = module:require 'util';
local presence_check_status = util.presence_check_status;

local um_is_admin = require 'core.usermanager'.is_admin;
local function is_admin(jid)
    return um_is_admin(jid, module.host);
end

local MUC_NS = 'http://jabber.org/protocol/muc';

-- get/infer focus component hostname so we can intercept IQ bound for it
local focus_component_host = module:get_option_string('focus_component');
if not focus_component_host then
    local muc_domain_base = module:get_option_string('muc_mapper_domain_base');
    if not muc_domain_base then
        module:log('error', 'Could not infer focus domain. Disabling %s', module:get_name());
        return;
    end
    focus_component_host = 'focus.'..muc_domain_base;
end

-- required parameter for custom muc component prefix, defaults to 'conference'
local muc_domain_prefix = module:get_option_string('muc_mapper_domain_prefix', 'conference');

local main_muc_component_config = module:get_option_string('main_muc');
if main_muc_component_config == nil then
    module:log('error', 'xxl rooms not enabled missing main_muc config');
    return ;
end

-- visitors_nodes = {
--  roomjid1 = {
--    nodes = {
--      ['conference.visitors1.jid'] = 2, // number of main participants, on 0 we clean it
--      ['conference.visitors2.jid'] = 3
--    }
--  },
--  roomjid2 = {}
--}
local visitors_nodes = {};

--- Intercept conference IQ error from Jicofo. Sends the main participants to the visitor node.
--- Jicofo is connected to the room when sending this error
module:log('info', 'Hook to iq/host');
module:hook('iq/full', function(event)
    local stanza = event.stanza;

    if stanza.name ~= 'iq' or stanza.attr.type ~= 'result' or stanza.attr.from ~= focus_component_host  then
        return;  -- not IQ from jicofo. Ignore this event.
    end

    local conference = stanza:get_child('conference', 'http://jitsi.org/protocol/focus');
    if not conference then
        return;
    end

    -- let's send participants if any from the room to the visitors room
    -- TODO fix room name extract, make sure it works wit tenants
    local main_room = conference.attr.room;
    local vnode = conference.attr.vnode;

    if not main_room or not vnode then
        return;
    end

    local room = get_room_from_jid(main_room);

    if room == nil then
        return;  -- room does not exists. Continue with normal flow
    end

    local conference_service = muc_domain_prefix..'.'..vnode..'.meet.jitsi';

    if visitors_nodes[room.jid] and
        visitors_nodes[room.jid].nodes and
        visitors_nodes[room.jid].nodes[conference_service] then
        -- nothing to do
        return;
    end

    if visitors_nodes[room.jid] == nil then
        visitors_nodes[room.jid] = {};
    end
    if visitors_nodes[room.jid].nodes == nil then
        visitors_nodes[room.jid].nodes = {};
    end

    local sent_main_participants = 0;

    for _, o in room:each_occupant() do
        if not is_admin(o.bare_jid) then
            local fmuc_pr = st.clone(o:get_presence());
            local user, _, res = jid.split(o.nick);
            fmuc_pr.attr.to = jid.join(user, conference_service , res);
            fmuc_pr.attr.from = o.jid;
            -- add <x>
            fmuc_pr:tag('x', { xmlns = MUC_NS }):up();

            module:send(fmuc_pr);

            sent_main_participants = sent_main_participants + 1;
        end
    end
    visitors_nodes[room.jid].nodes[conference_service] = sent_main_participants;
end, 900);

-- takes care when the visitor nodes destroys the room to count the leaving participants from there, and if its really destroyed
-- we clean up, so if we establish again the connection to the same visitor node to send the main participants
module:hook('presence/full', function(event)
    local stanza = event.stanza;
    local room_name, from_host = jid.split(stanza.attr.from);
    if stanza.attr.type == 'unavailable' and from_host ~= main_muc_component_config then
        -- TODO tenants???
        local room_jid = jid.join(room_name, main_muc_component_config); -- converts from visitor to main room jid

        local x = stanza:get_child('x', 'http://jabber.org/protocol/muc#user');
        if not presence_check_status(x, '110') then
            return;
        end

        if visitors_nodes[room_jid] and visitors_nodes[room_jid].nodes
                and visitors_nodes[room_jid].nodes[from_host] then
            visitors_nodes[room_jid].nodes[from_host] = visitors_nodes[room_jid].nodes[from_host] - 1;
            if visitors_nodes[room_jid].nodes[from_host] == 0 then
                visitors_nodes[room_jid].nodes[from_host] = nil;
            end
        end
    end
end, 900);

-- process a host module directly if loaded or hooks to wait for its load
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

process_host_module(main_muc_component_config, function(host_module, host)
    -- detects presence change in a main participant and propagate it to the used visitor nodes
    host_module:hook('muc-occupant-pre-change', function (event)
        local room, stanza, occupant = event.room, event.stanza, event.dest_occupant;

        -- filter focus
        if is_admin(stanza.attr.from) or visitors_nodes[room.jid] == nil then
            return;
        end

        local vnodes = visitors_nodes[room.jid].nodes;
        -- a change in the presence of a main participant we need to update all active visitor nodes
        for k in pairs(vnodes) do
            local fmuc_pr = st.clone(stanza);
            local user, _, res = jid.split(occupant.nick);
            fmuc_pr.attr.to = jid.join(user, k, res);
            fmuc_pr.attr.from = occupant.jid;
            module:send(fmuc_pr);
        end
    end);

    -- when a main participant leaves inform the visitor nodes
    host_module:hook('muc-occupant-left', function (event)
        local room, stanza, occupant = event.room, event.stanza, event.occupant;

        if is_admin(occupant.bare_jid) or visitors_nodes[room.jid] == nil or visitors_nodes[room.jid].nodes == nil then
            return;
        end

        -- we want to update visitor node that a main participant left
        if stanza then
            local vnodes = visitors_nodes[room.jid].nodes;
            for k in pairs(vnodes) do
                local fmuc_pr = st.clone(stanza);
                local user, _, res = jid.split(occupant.nick);
                fmuc_pr.attr.to = jid.join(user, k, res);
                fmuc_pr.attr.from = occupant.jid;
                module:send(fmuc_pr);
            end
        else
            module:log('warn', 'No unavailable stanza found ... leak participant on visitor');
        end
    end);

    -- cleanup cache
    host_module:hook('muc-room-destroyed',function(event)
        visitors_nodes[event.room.jid] = nil;
    end);
end);
