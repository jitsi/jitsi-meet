--- To be enabled under the main muc component
local filters = require 'util.filters';
local st = require 'util.stanza';

local util = module:require 'util';
local get_room_by_name_and_subdomain = util.get_room_by_name_and_subdomain;
local is_admin = util.is_admin;
local ends_with = util.ends_with;
local internal_room_jid_match_rewrite = util.internal_room_jid_match_rewrite;

local NICK_NS = 'http://jabber.org/protocol/nick';

-- we need to get the shared resource for joining moderators, as participants are marked as moderators
-- after joining which is after the filter for stanza/out, but we need to know will this participant be a moderator
local joining_moderator_participants = module:shared('moderators/joining_moderator_participants');

function filter_stanza_out(stanza, session)
    if stanza.name ~= 'presence' or stanza.attr.type == 'error'
        or stanza.attr.type == 'unavailable' or ends_with(stanza.attr.from, '/focus') then
        return stanza;
    end

    local room = get_room_by_name_and_subdomain(session.jitsi_web_query_room, session.jitsi_web_query_prefix);

    if not room or room._data.hideDisplayNameForGuests ~= true then
        return stanza;
    end

    local occupant = room:get_occupant_by_real_jid(stanza.attr.to);
    if occupant then
        if stanza.attr.from == internal_room_jid_match_rewrite(occupant.nick) then
            -- we ignore self-presences, in this case and role will not be correct
            return stanza;
        end

        if occupant.role ~= 'moderator' and not joining_moderator_participants[occupant.bare_jid] then
            local st_clone = st.clone(stanza);
            st_clone:remove_children('nick', NICK_NS);
            return st_clone;
        end
    end

    return stanza;
end

function filter_stanza_in(stanza, session)
    if stanza.name ~= 'presence' or stanza.attr.type == 'error' or stanza.attr.type == 'unavailable' then
        return stanza;
    end

    local room = get_room_by_name_and_subdomain(session.jitsi_web_query_room, session.jitsi_web_query_prefix);

    -- if hideDisplayNameForAll we want to drop any display name from the presence stanza
    if not room or room._data.hideDisplayNameForAll ~= true then
        return stanza;
    end

    stanza:remove_children('nick', NICK_NS);

    return stanza;
end

function filter_session(session)
    filters.add_filter(session, 'stanzas/out', filter_stanza_out, -100);
    filters.add_filter(session, 'stanzas/in', filter_stanza_in, -100);
end

function module.load()
    filters.add_filter_hook(filter_session);
end

function module.unload()
    filters.remove_filter_hook(filter_session);
end
