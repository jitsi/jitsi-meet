-- Server side handling of chat message moderation (XEP-0425) and message
-- correction (XEP-0308) for Jitsi MUC rooms.
--
-- Both operations used to be synchronised client to client over json messages,
-- and late joiners were brought up to date by every participant replaying the
-- current state to them on join. Handling both here keeps the room history
-- itself correct, so a joining client needs no follow up at all.
--
-- 1. Moderation (XEP-0425). An occupant sends:
--
--      <message type='groupchat'>
--        <apply-to xmlns='urn:xmpp:fasten:0' id='ORIG'>
--          <moderated xmlns='urn:xmpp:message-moderate:1'>
--            <retract xmlns='urn:xmpp:message-retract:1'/>
--            <reason>spam</reason>
--          </moderated>
--        </apply-to>
--      </message>
--
--    The request is honoured only when the sending occupant's MUC role is
--    'moderator'. The room history entry for ORIG is replaced with a tombstone
--    (body stripped, <moderated by='...'><retracted/></moderated> added) so late
--    joiners never receive the moderated text at all, and the moderation is
--    broadcast from the room JID. The occupant's own request is not relayed, the
--    room emits its own stanza and takes 'by' from the sender's occupant JID.
--    A message that has aged out of the history window is still moderated for
--    everyone in the room, there is just no entry left to turn into a tombstone.
--    'jitsi-message-moderated' is fired alongside the broadcast so mod_visitors
--    can forward it to the visitor nodes, which the room's own broadcast does
--    not reach.
--
-- 2. Correction (XEP-0308). An occupant sends a new body carrying:
--
--      <replace xmlns='urn:xmpp:message-correct:0' id='ORIG'/>
--
--    The request is honoured only when ORIG was authored by the same occupant
--    and has not been moderated; anything else is dropped and reaches nobody.
--    An honoured correction is relayed untouched: it carries the new body and
--    asks to be stored, so the room archives it and replays it after the message
--    it corrects, and a client joining later applies it the same way one in the
--    room does. Nothing here rewrites the history entry.
--
-- 3. Retraction (XEP-0424). The author retracts their own message with a
--    top level:
--
--      <retract xmlns='urn:xmpp:message-retract:1' id='ORIG'/>
--
--    The request is honoured only when ORIG was authored by the same occupant.
--    The history entry is removed outright rather than tombstoned, so a joining
--    client never receives the message at all, and the retraction is not stored
--    either since there is no longer anything for it to pair with. The retraction
--    stanza itself is what reaches the occupants already in the room.
--
-- The moderation the room broadcasts and the retraction are kept out of history:
-- the first is already reflected in the tombstone, and the second removed the
-- entry it referred to.
--
-- Rooms advertise 'muc#roominfo_messageModerationEnabled' so a client can tell
-- whether the server is here to apply these operations, and offer the moderate
-- and edit actions only when it is.
--
-- Needs to be activated under the muc component where message moderation and
-- editing should be handled. Without it the client hides both actions, as the
-- room stops advertising them.
--
-- Load it on a visitor prosody's muc component too. There it keeps the local
-- history in step for the operations that are not replayed on their own, and
-- advertises the room info field so visitors see the same actions. It does not
-- check anything that reached it from the main prosody, which is where the room
-- the occupants act in lives and where every request is checked. It does check
-- the author of a visitor's own request, since that has not been past the main
-- prosody yet at the point this node routes it.
--
--   Component "conference.meet.jitsi" "muc"
--       modules_enabled = { "muc_message_moderation" }
--
-- Copyright (C) 2026-present 8x8, Inc.

local st = require 'util.stanza';
local id = require 'util.id';
local jid = require 'util.jid';
local datetime = require 'util.datetime';

local ends_with = module:require 'util'.ends_with;

-- only the visitor prosody has a main_domain setting
local main_domain = module:get_option_string('main_domain');
local local_domain = module:get_option_string('muc_mapper_domain_base');

local FASTEN_NS = 'urn:xmpp:fasten:0';
local MODERATE_NS = 'urn:xmpp:message-moderate:1';
local RETRACT_NS = 'urn:xmpp:message-retract:1';
local CORRECT_NS = 'urn:xmpp:message-correct:0';
local HINTS_NS = 'urn:xmpp:hints';

-- Returns the id of the message the stanza asks to moderate and the optional
-- reason, or nil when the stanza is not a moderation request.
function parse_moderation_request(stanza)
    local apply_to = stanza:get_child('apply-to', FASTEN_NS);

    if not apply_to or not apply_to.attr.id then
        return nil;
    end

    local moderated = apply_to:get_child('moderated', MODERATE_NS);

    if not moderated or not moderated:get_child('retract', RETRACT_NS) then
        return nil;
    end

    -- 'by' is only meaningful on a stanza a room has sent, where the server
    -- stamped it. On an occupant's own request it is whatever they typed.
    return apply_to.attr.id, moderated:get_child_text('reason'), moderated.attr.by;
end

-- Returns the id of the message the stanza corrects and the new body, or nil
-- when the stanza is not a correction.
function parse_correction(stanza)
    local replace = stanza:get_child('replace', CORRECT_NS);

    if not replace or not replace.attr.id then
        return nil;
    end

    local body = stanza:get_child_text('body');

    if not body then
        return nil;
    end

    return replace.attr.id, body;
end

-- Returns the id of the message the stanza retracts, or nil when the stanza is
-- not a retraction. A moderation request also carries a <retract/>, but nested
-- inside <apply-to><moderated/>, so it is not matched here.
function parse_retraction(stanza)
    local retract = stanza:get_child('retract', RETRACT_NS);

    if not retract or not retract.attr.id then
        return nil;
    end

    return retract.attr.id;
end

-- Finds the room history entry for a message id. Searches newest first, as
-- edits and moderation overwhelmingly target recent messages.
function find_history_entry(room, message_id)
    local history = room._history;

    if not history or not message_id then
        return nil;
    end

    for i = #history, 1, -1 do
        local entry = history[i];

        if entry.stanza and entry.stanza.attr.id == message_id then
            return entry, i;
        end
    end

    return nil;
end

function is_entry_moderated(entry)
    return entry.stanza:get_child('moderated', MODERATE_NS) ~= nil;
end

-- Replaces a history entry with a XEP-0425 tombstone. The body is dropped so
-- the moderated text is never sent to anyone joining later.
function tombstone_entry(entry, by, reason, stamp)
    local tombstone = st.clone(entry.stanza);

    tombstone:remove_children('body');
    tombstone:remove_children('replace', CORRECT_NS);
    -- never nest two moderation markers if the same message is moderated twice
    tombstone:remove_children('moderated', MODERATE_NS);

    local moderated = st.stanza('moderated', { xmlns = MODERATE_NS, by = by })
        :tag('retracted', { xmlns = RETRACT_NS, stamp = stamp }):up();

    if reason and reason ~= '' then
        moderated:tag('reason'):text(reason):up();
    end

    tombstone:add_child(moderated);
    entry.stanza = tombstone;

    return entry;
end

-- The stanza the room sends to announce a moderation. It carries no body, so a
-- client that does not understand it simply ignores it.
function build_moderation_broadcast(room, target_id, by, reason)
    local moderated = st.stanza('moderated', { xmlns = MODERATE_NS, by = by })
        :tag('retract', { xmlns = RETRACT_NS }):up();

    if reason and reason ~= '' then
        moderated:tag('reason'):text(reason):up();
    end

    local broadcast = st.message({ from = room.jid, type = 'groupchat', id = id.medium() })
        :tag('apply-to', { xmlns = FASTEN_NS, id = target_id });

    broadcast:add_child(moderated);
    broadcast:up();
    broadcast:add_child(st.stanza('no-store', { xmlns = HINTS_NS }));

    return broadcast;
end

-- 'occupant' comes from the hook rather than from stanza.attr.from, which still
-- holds the sender's real jid at this point; the room rewrites it to the
-- occupant nick only after the event has run.
function handle_moderation(origin, room, stanza, occupant, target_id, reason)
    if not occupant or occupant.role ~= 'moderator' then
        module:log('warn', 'Rejected moderation of %s from non-moderator %s', target_id, stanza.attr.from);
        origin.send(st.error_reply(stanza, 'auth', 'forbidden', 'Only moderators can moderate messages'));

        return true;
    end

    local entry = find_history_entry(room, target_id);

    -- The message may have aged out of the room's history window. The moderator's
    -- decision still stands for everyone in the room, there is simply no entry
    -- left to turn into a tombstone.
    if entry then
        tombstone_entry(entry, occupant.nick, reason, datetime.datetime());
    end

    local broadcast = build_moderation_broadcast(room, target_id, occupant.nick, reason);

    room:broadcast_message(broadcast);

    -- broadcast_message only reaches occupants of this room. Visitor nodes are
    -- separate prosodies, and the hook that forwards occupant messages to them
    -- never sees this stanza because the room sent it, so announce it for
    -- mod_visitors to fan out.
    module:fire_event('jitsi-message-moderated', { room = room; stanza = broadcast; });

    -- the room has emitted its own stanza, don't relay the occupant's request
    return true;
end

function handle_correction(origin, room, stanza, occupant, target_id, body)
    local entry = find_history_entry(room, target_id);

    -- With no entry the message has aged out of the room's history window, so
    -- there is nothing to rewrite and no author to check it against. Relay it and
    -- let the receiving clients apply it to their own copy.
    if entry then
        if not occupant or entry.stanza.attr.from ~= occupant.nick then
            module:log('warn', 'Rejected correction of %s from %s, authored by %s',
                target_id, occupant and occupant.nick, entry.stanza.attr.from);
            origin.send(st.error_reply(stanza, 'auth', 'forbidden', 'Only the author can correct a message'));

            return true;
        end

        if is_entry_moderated(entry) then
            module:log('debug', 'Rejected correction of moderated message %s', target_id);
            origin.send(st.error_reply(stanza, 'cancel', 'not-allowed', 'Message has been moderated'));

            return true;
        end
    end

    module:log('debug', 'Relaying correction of %s from %s', target_id, occupant and occupant.nick);

    -- fall through. The correction carries the new body and asks to be stored, so
    -- the room archives it and replays it to anyone joining later, in order after
    -- the message it corrects. Nothing here has to rewrite the entry.
end

-- The author retracting their own message. The history entry is dropped, so the
-- message is simply absent for anyone joining later.
function handle_retraction(origin, room, stanza, occupant, target_id)
    local entry, index = find_history_entry(room, target_id);

    -- With no entry the message has aged out of the room's history window, so
    -- there is nothing to remove and no author to check it against.
    if entry then
        if not occupant or entry.stanza.attr.from ~= occupant.nick then
            module:log('warn', 'Rejected retraction of %s from %s, authored by %s',
                target_id, occupant and occupant.nick, entry.stanza.attr.from);
            origin.send(st.error_reply(stanza, 'auth', 'forbidden', 'Only the author can retract a message'));

            return true;
        end

        table.remove(room._history, index);
    end

    -- The message is gone from history, so a stored retraction has nothing left to
    -- pair with. The client asks for it to be stored, override that.
    stanza:remove_children('store', HINTS_NS);
    stanza:add_child(st.stanza('no-store', { xmlns = HINTS_NS }));

    -- fall through, the retraction the client sent is what reaches the occupants
    -- in the room
end

function handle_groupchat(event)
    local origin, room, stanza, occupant = event.origin, event.room, event.stanza, event.occupant;

    if stanza.attr.type ~= 'groupchat' then
        return;
    end

    local moderate_id, reason = parse_moderation_request(stanza);

    if moderate_id then
        return handle_moderation(origin, room, stanza, occupant, moderate_id, reason);
    end

    local correct_id, body = parse_correction(stanza);

    if correct_id then
        return handle_correction(origin, room, stanza, occupant, correct_id, body);
    end

    local retract_id = parse_retraction(stanza);

    if retract_id then
        return handle_retraction(origin, room, stanza, occupant, retract_id);
    end
end

-- Whether this node may apply an operation to its own history entry. A stanza
-- from an occupant of this node is a visitor's own request that the main prosody
-- has not seen yet, so the author is checked against the entry. Anything else
-- arrived from the main prosody, which has already checked it.
function may_apply_locally(entry, occupant)
    if not occupant or jid.host(occupant.bare_jid) ~= local_domain then
        return true;
    end

    return entry.stanza.attr.from == occupant.nick;
end

-- On a visitor node this module only keeps the local history in step. The room
-- that occupants act in lives on the main prosody, which has already checked the
-- role or the authorship, so nothing is checked again here and no reply is sent.
-- Runs above mod_fmuc's hook and falls through, so fmuc still routes the stanza
-- to the local occupants exactly as before.
function handle_main_groupchat(event)
    local room, stanza, occupant = event.room, event.stanza, event.occupant;

    if stanza.attr.type ~= 'groupchat' then
        return;
    end

    -- Editing and retraction already reach the occupants of this node through the
    -- normal forwarding, so only the local history entry needs bringing in line.
    local retract_id = parse_retraction(stanza);

    if retract_id then
        local entry, index = find_history_entry(room, retract_id);

        if entry and may_apply_locally(entry, occupant) then
            module:log('debug', 'Removing retracted %s from %s history', retract_id, room.jid);
            table.remove(room._history, index);
        end

        return;
    end

    -- A moderation is sent by the main room itself, so it never arrives as an
    -- occupant's stanza and nothing else routes it to the occupants here.
    if occupant then
        return;
    end

    local from_host = jid.host(stanza.attr.from or '');

    if not from_host or not ends_with(from_host, main_domain) then
        if parse_moderation_request(stanza) then
            module:log('debug', 'Ignoring moderation from %s, not under %s', stanza.attr.from, main_domain);
        end

        return;
    end

    local moderate_id, reason, by = parse_moderation_request(stanza);

    if moderate_id then
        local entry = find_history_entry(room, moderate_id);

        if entry then
            tombstone_entry(entry, by, reason, datetime.datetime());
        end

        -- Announce it from this room rather than relaying what arrived. The
        -- forwarded stanza was sent by the main room, which is not an occupant
        -- here, so the from it ends up with depends on how the hop rewrites it.
        -- Building it locally means only the addressing had to survive the hop.
        module:log('debug', 'Announcing moderation of %s on %s', moderate_id, room.jid);

        local broadcast = build_moderation_broadcast(room, moderate_id, by, reason);

        -- Route it to the occupants of this node only. The main prosody's
        -- participants are occupants here as well and it has already told them;
        -- this node has no route to them and would only log a routing error.
        for _, o in room:each_occupant() do
            if jid.host(o.bare_jid) == local_domain then
                room:route_to_occupant(o, broadcast);
            end
        end

        return true;
    end
end

-- Belt and braces next to the no-store hint: moderation broadcasts, corrections
-- and retractions are already reflected in the entry for the original message, or
-- in its removal, so they must not be appended to history as messages of their own.
function skip_history(event)
    local stanza = event.stanza;

    if stanza:get_child('apply-to', FASTEN_NS)
        or stanza:get_child('retract', RETRACT_NS) then
        return true;
    end
end

-- Advertised so clients only offer moderating and editing where the server is
-- here to apply them and keep the room history in step.
local message_moderation_field = {
    name = 'muc#roominfo_messageModerationEnabled';
    type = 'boolean';
    label = 'Whether message moderation and editing are handled by the server.';
    value = 1;
};

function add_room_info(event)
    table.insert(event.form, message_moderation_field);
end

module:hook('muc-add-history', skip_history, 10);
module:hook('muc-disco#info', add_room_info);
module:hook('muc-config-form', add_room_info);

if main_domain then
    -- A visitor node only mirrors what the main prosody applied. The checking
    -- handlers are deliberately not registered here: they compare an author
    -- against the local occupant nick, and on a visitor node the history entry
    -- came from the main prosody's snapshot, so the comparison would refuse a
    -- visitor's own edit rather than apply it.
    --
    -- mod_fmuc handles visitor chat at priority 55 and stops there, so run above
    -- it and fall through once the local history has been brought in line.
    module:hook('muc-occupant-groupchat', handle_main_groupchat, 60);
else
    module:hook('muc-occupant-groupchat', handle_groupchat, 10);
end

module:log('info', 'Loaded MUC message moderation and correction for %s', module.host);
