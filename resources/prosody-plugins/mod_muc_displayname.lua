-- Manages display names and identity visibility in MUC rooms.
--
-- Three behaviours:
--
-- 1. hideDisplayNameForGuests (outbound filter on stanzas/out, priority -100):
--    When room._data.hideDisplayNameForGuests is true, strips identity elements
--    (<nick>, <email>, <stats-id>, and name/email inside <identity>) from
--    presence stanzas before they are delivered to non-moderator occupants.
--    Moderator recipients and self-presence are always passed through unchanged.
--    The room is the one the presence comes from.
--
-- 2. name-readonly (inbound filter on stanzas/in, priority -100):
--    When session.jitsi_meet_context_features['name-readonly'] is true, enforces
--    the display name from the JWT token on every outgoing presence from that session:
--      * Token has context.user.name  → replaces the <nick> element with the token name
--      * Token has no name            → removes the <nick> element entirely
--    This prevents clients from changing their display name when the token marks
--    it as read-only.
--
-- 3. Message display-name handling (MUC hooks):
--    muc-occupant-groupchat (priority 45): strips the <nick> and <display-name>
--    that the client added to a groupchat message, before the message is
--    relayed, stored or delivered.
--    muc-broadcast-message (priority -1): strips <nick> and <display-name> from
--    the stanza in the event. For a message that did not come through
--    muc-occupant-groupchat, this is the stanza that the room delivers, unless
--    muc-add-history replaced it with a clone.
--    muc-add-history: injects <display-name source="token|guest"> into the
--    history copy of each message (cloned from the broadcast stanza), sourced
--    from session.jitsi_meet_context_user.name (token users) or the <nick>
--    element (guests).  Late-joining clients receive this annotated history.
--
-- Load on the MUC component.
local filters = require 'util.filters';
local jid = require 'util.jid';
local st = require 'util.stanza';

local util = module:require 'util';
local filter_identity_from_presence = util.filter_identity_from_presence;
local get_room_from_jid = util.get_room_from_jid;
local is_admin = util.is_admin;
local is_focus = util.is_focus;
local internal_room_jid_match_rewrite = util.internal_room_jid_match_rewrite;
local room_jid_match_rewrite = util.room_jid_match_rewrite;
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
        or stanza.attr.type == 'unavailable' or not stanza.attr.from or is_focus(stanza.attr.from) then
        return stanza;
    end

    -- the room the presence comes from, the from can be the virtual (tenant) address so map it to the internal one
    local room = get_room_from_jid(room_jid_match_rewrite(jid.bare(stanza.attr.from)));
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
        or stanza.attr.type == 'unavailable' then
        return stanza;
    end

    -- if the user does not have a name in token and name is readonly, remove any nick element
    if not session.jitsi_meet_context_user or not session.jitsi_meet_context_user.name then
        stanza:remove_children('nick', NICK_NS);
        return stanza;
    end

    local nick_element = stanza:get_child('nick', NICK_NS);

    if nick_element and nick_element:get_text() ~= session.jitsi_meet_context_user.name then
        stanza:remove_children('nick', NICK_NS);
        stanza:tag('nick', { xmlns = NICK_NS }):text(session.jitsi_meet_context_user.name):up();
    end

    return stanza;
end

-- A groupchat message from an occupant of the room: remove the nick and display-name elements that
-- the client added. The server adds the display-name itself, to the history copy only, in
-- 'muc-add-history'.
-- This changes the stanza that the room delivers. It must run before any handler that copies the
-- stanza. Today these are the relay to the visitor nodes in mod_visitors (default priority) and
-- the history.
-- mod_muc_meeting_id also removes the nick at this priority, the order between the two does not matter.
-- A message that a visitor node relays has no occupant here. mod_visitors handles it at a higher
-- priority than the prosody check of the sender and stops the event, so its display-name stays.
-- The prosody check stops any other message that has no occupant, so the check below is only a guard.
module:hook('muc-occupant-groupchat', function(event)
    if not event.occupant then
        return;
    end

    event.stanza:remove_children('nick', NICK_NS);
    event.stanza:remove_children('display-name', DISPLAY_NAME_NS);
end, 45); -- the prosody check of the sender is priority 50, we want to run after it

-- 'muc-add-history' is called in 'muc-broadcast-message' with priority 0
-- we want to clean up message after we have processed it for history, but do it for all messages
-- not only those that are added to history (a message can have 'no-store').
-- Note: when our 'muc-add-history' handler replaced event.stanza with a clone, this hook changes only
-- that clone. It changes neither the stored history entry (the prosody history handler made its own
-- clone before this hook) nor the stanza that the room delivers. A message from an occupant is
-- already clean (see above).
module:hook('muc-broadcast-message', function(event)
    -- clear up nick and display-name elements of the stanza in the event
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
                name = occupant:get_presence():get_child_text('nick', NICK_NS);
            else
                name = session.jitsi_meet_context_user.name;
            end

            source = 'token';
        else
            name = occupant:get_presence():get_child_text('nick', NICK_NS);
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
