--- This module removes identity information from presence stanzas when the
--- hideDisplayNameForGuests options are enabled
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
local NICK_NS = 'http://jabber.org/protocol/nick';
local DISPLAY_NAME_NS = 'http://jitsi.org/protocol/display-name';

local sessions = prosody.full_sessions;

local ignore_jwt_name = module:get_option_boolean('ignore_jwt_name', false);

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

    if room and room._data.hideDisplayNameForGuests == true then
        local occupant = room:get_occupant_by_real_jid(stanza.attr.to);
        -- don't touch self-presence
        if occupant and stanza.attr.from ~= internal_room_jid_match_rewrite(occupant.nick) then
            shouldFilter = occupant.role ~= 'moderator' and not joining_moderator_participants[occupant.bare_jid];
        end
    end

    if shouldFilter then
        return filter_identity_from_presence(stanza);
    else
        return stanza;
    end
end

-- When a participant has a name-readonly feature enabled, we need to ensure that the
-- nick element in the presence stanza is set to the user's name, if it exists.
-- If the user does not have a name, we remove the nick element.
-- This is to ensure that the name is not changed by the user, as it is read-only.
function filter_stanza_in(stanza, session)
    if not session or not session.jitsi_meet_context_features
        or session.jitsi_meet_context_features['name-readonly'] ~= true then
        -- if the name-readonly feature is not set, there is nothing we need to do
        return stanza;
    end

    if stanza.name ~= 'presence' or stanza.attr.type == 'error'
        or stanza.attr.type == 'unavailable' or ends_with(stanza.attr.from, '/focus') then
        return stanza;
    end

    -- if the user does not have a name in token and name is readonly, remove any nick element
    if not session.jitsi_meet_context_user or not session.jitsi_meet_context_user.name then
        stanza:remove_children('nick', NICK_NS);
        return stanza;
    end

    local nick_element = stanza:get_child('nick', NICK_NS);

    if nick_element:get_text() ~= session.jitsi_meet_context_user.name then
        stanza:remove_children('nick', NICK_NS);
        stanza:tag('nick', { xmlns = NICK_NS }):text(session.jitsi_meet_context_user.name):up();
    end

    return stanza;
end

-- 'muc-add-history' is called in 'muc-broadcast-message' with priority 0
-- we want to clean up message after we have processed it for history, but do it for all messages
-- not only those that are added to history (as someone can forge a message and add 'no-store')
module:hook('muc-broadcast-message', function(event)
    -- any message that is about to be delivered, clear up nick and display-name elements
    event.stanza:remove_children('nick', NICK_NS);
    event.stanza:remove_children('display-name', DISPLAY_NAME_NS);
end, -1);

module:hook('muc-add-history', function(event)
    local room, stanza = event.room, event.stanza;
    local name;
    local source;

    local occupant = room:get_occupant_by_nick(stanza.attr.from);

    if occupant then
        local session = sessions[occupant.jid];
        if session and session.jitsi_meet_context_user then
            if ignore_jwt_name then
                name = occupant:get_presence():get_child('nick', NICK_NS):get_text();
            else
                name = session.jitsi_meet_context_user.name;
            end

            source = 'token';
        else
            name = occupant:get_presence():get_child('nick', NICK_NS):get_text();
            source = 'guest';
        end
    else
        -- if no occupant found it is a message from visitor let's check display-name source
        local display_name_element = stanza:get_child('display-name', DISPLAY_NAME_NS);
        if display_name_element and display_name_element.attr.source == 'visitor' then
            name = display_name_element:get_text();
            source = display_name_element.attr.source;
        end
    end

    if name then
        -- clone the stanza, so only history has the display_name extension
        event.stanza = st.clone(stanza);

        event.stanza:tag('display-name', {
            xmlns = DISPLAY_NAME_NS,
            source = source
        }):text(name):up();
    end
end);

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
