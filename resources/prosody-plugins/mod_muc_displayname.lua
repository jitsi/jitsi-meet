--- This module removes identity information from presence stanzas when the
--- hideDisplayNameForAll or hideDisplayNameForGuests options are enabled
--- for a room.

--- To be enabled under the main muc component
local filters = require 'util.filters';
local st = require 'util.stanza';

local util = module:require 'util';
local filter_identity_from_presence = util.filter_identity_from_presence;
local get_room_by_name_and_subdomain = util.get_room_by_name_and_subdomain;
local is_admin = util.is_admin;
local ends_with = util.ends_with;
local internal_room_jid_match_rewrite = util.internal_room_jid_match_rewrite;

-- we need to get the shared resource for joining moderators, as participants are marked as moderators
-- after joining which is after the filter for stanza/out, but we need to know will this participant be a moderator
local joining_moderator_participants = module:shared('moderators/joining_moderator_participants');

--- Filter presence sent to non-moderator members of a room when the hideDisplayNameForGuests option is set.
function filter_stanza_out(stanza, session)
    if stanza.name ~= 'presence' or stanza.attr.type == 'error'
        or stanza.attr.type == 'unavailable' or ends_with(stanza.attr.from, '/focus') then
        return stanza;
    end

    local room = get_room_by_name_and_subdomain(session.jitsi_web_query_room, session.jitsi_web_query_prefix);
    local shouldFilter = false;

    if room and (room._data.hideDisplayNameForGuests == true or room._data.hideDisplayNameForAll == true) then
        local occupant = room:get_occupant_by_real_jid(stanza.attr.to);
        -- don't touch self-presence
        if occupant and stanza.attr.from ~= internal_room_jid_match_rewrite(occupant.nick) then
            local isModerator = (occupant.role == 'moderator' or joining_moderator_participants[occupant.bare_jid]);
            shouldFilter = room._data.hideDisplayNameForAll or not isModerator;
        end
    end

    if shouldFilter then
        return filter_identity_from_presence(stanza);
    else
        return stanza;
    end
end

function filter_session(session)
    filters.add_filter(session, 'stanzas/out', filter_stanza_out, -100);
end

function module.load()
    filters.add_filter_hook(filter_session);
end

function module.unload()
    filters.remove_filter_hook(filter_session);
end
