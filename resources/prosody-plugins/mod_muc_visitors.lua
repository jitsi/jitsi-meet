local jid_node = require 'util.jid'.node;
local jid_resource = require "util.jid".resource;
local st = require "util.stanza";

-- Add the following config to the main muc component
--      muc_room_default_presence_broadcast = {
--         visitor = false;
--         participant = true;
--         moderator = true;
--     };
-- This will filter presence of visitors to be broadcast to any visitor or participant including jicofo
-- We handle the jicofo part specially and forward the presence
--
-- To activate the module create a separate virtualhost, like
-- VirtualHost "visitors.jitmeet.example.com"
--     authentication = "anonymous"
--     modules_enabled = {
--         "bosh";
--         "ping"; -- Enable mod_ping
--         "external_services";
--         "conference_duration";
--         "muc_visitors";
--     }
--     c2s_require_encryption = false
--     main_muc = "conference.jitmeet.example.com"

local main_muc_component_config = module:get_option_string('main_muc');

function starts_with(str, start)
    return str:sub(1, #start) == start
end

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
process_host_module(
    main_muc_component_config,
    function(host_module, host)
        main_muc_service = prosody.hosts[host].modules.muc;

        host_module:hook('muc-occupant-pre-join', function (event)
            local occupant = event.occupant;

            if string.find(occupant.bare_jid, module.host) then
                occupant.role = 'visitor';
                --occupant.is_visitor = true;
            end
        end, 3);

        host_module:hook('muc-broadcast-presence', function (event)
            local occupant = event.occupant;

            -- we are interested only of visitors presence to send it to jicofo
            --if not occupant.is_visitor then
            if not string.find(occupant.bare_jid, module.host) then
                return;
            end

            local room = event.room;
            if not room._data.focus_occupant then
                for _, n_occupant in room:each_occupant() do
                    if jid_node(n_occupant.jid) == 'focus' then
                        room._data.focus_occupant = n_occupant;
                        room:save(true);
                        break;
                    end
                end
            end

            local actor, base_presence, nick, reason, x
                = event.actor, event.stanza, event.nick, event.reason, event.x;
            local actor_nick;
            if actor then
                actor_nick = jid_resource(room:get_occupant_jid(actor));
            end

            local full_x = st.clone(x.full or x);
            room:build_item_list(occupant, full_x, false, nick, actor_nick, actor, reason);
            local full_p = st.clone(base_presence):add_child(full_x);

            room:route_to_occupant(room._data.focus_occupant, full_p);
            return;
        end);
    end
);
