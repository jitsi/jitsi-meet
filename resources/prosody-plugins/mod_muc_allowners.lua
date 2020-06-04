local jid = require "util.jid";
local is_healthcheck_room = module:require "util".is_healthcheck_room;

local moderated_subdomains;
local moderated_rooms;

local function load_config()
    moderated_subdomains = module:get_option_set("allowners_moderated_subdomains", {})
    moderated_rooms = module:get_option_set("allowners_moderated_rooms", {})
end
load_config();

-- Checks whether the jid is moderated, the room name is in moderated_rooms
-- or if the subdomain is in the moderated_subdomains
-- @return returns on of the:
--      -> false
--      -> true, subdomain, nil (in case of matching by subdomain)
--      -> true, nil, room_name (if matched by room name)
local function isModerated(room_jid)
    local room_node = jid.node(room_jid);
    -- parses bare room address, for multidomain expected format is:
    -- [subdomain]roomName@conference.domain
    local target_subdomain = room_node:match("^%[([^%]]+)%](.+)$");

    if target_subdomain then
        if moderated_subdomains:contains(target_subdomain) then
            return true, target_subdomain, nil;
        end
    elseif moderated_rooms:contains(room_node) then
        return true, nil, room_node;
    end

    return false;
end

-- we need to hook on stanzas to be able to prevent focus(jicofo) from setting owner for the
-- first participant in the room
for _, event_name in pairs({
    -- Normal room interactions
    "iq-set/bare/http://jabber.org/protocol/muc#admin:query",
    -- Host room
    "iq-set/host/http://jabber.org/protocol/muc#admin:query"
})
do
    module:hook(event_name, function (event)
        local origin, stanza = event.origin, event.stanza;
        local room_jid = jid.bare(stanza.attr.to);
        local actor = stanza.attr.from;

        local item = stanza.tags[1].tags[1];
        if not item then
            origin.send(st.error_reply(stanza, "cancel", "bad-request"));
            return true;
        end

        local actor_node = jid.node(actor);
        if actor_node == 'focus' and item.attr.affiliation == 'owner' then
            local moderated = isModerated(room_jid);

            if moderated then
                module:log('debug', 'skip focus setting owner for: %s in %s', item.attr.jid, room_jid);
                return true;
            end
        end
    end, -1); -- the priority in prosody for these is -2, we want to act before it
end


module:hook("muc-occupant-joined", function (event)
    local room, occupant = event.room, event.occupant;

    if is_healthcheck_room(room.jid) then
        return;
    end

    local moderated, subdomain, room_name = isModerated(room.jid);
    if moderated then
        local session = event.origin;
        local token = session.auth_token;

        if not token then
            module:log('debug', 'skip allowners for non-auth user subdomain:%s room_name:%s', subdomain, room_name);
            return;
        end

        if subdomain and not subdomain == session.jitsi_meet_context_group then
            module:log('debug', 'skip allowners for auth user and non matching room subdomain: %s, jwt subdomain: %s', subdomain, session.jitsi_meet_context_group);
            return;
        end

        if room_name and not room_name == session.jitsi_meet_room then
            module:log('debug', 'skip allowners for auth user and non matching room name: %s, jwt room name: %s', room_name, session.jitsi_meet_room);
            return;
        end
    end

    room:set_affiliation(true, occupant.bare_jid, "owner");
end, 2);

module:hook("muc-occupant-left", function (event)
    local room, occupant = event.room, event.occupant;

    if is_healthcheck_room(room.jid) then
        return;
    end

    room:set_affiliation(true, occupant.bare_jid, nil);
end, 2);

module:hook_global('config-reloaded', load_config);
