-- mod_audio_translation_component.lua
--
-- Prosody component that collects per-receiver live-translation subscriptions
-- and exposes the aggregated <senderId, set<language>> map to jicofo (and only
-- jicofo) through RoomMetadata.
--
-- ── Subscription updates (client → component) ────────────────────────────────
-- A receiver sends a <message> to this component containing an <audio-translation
-- xmlns='http://jitsi.org/jitmeet'> child whose text is a JSON object that maps a
-- sender's endpoint id to a target language:
--
--   { "a1b2c3d4": "en", "b2c3d4e5": "" }
--
-- The payload is a DELTA merged into the receiver's existing subscription map:
--  · "<lang>" adds/replaces the subscription for that sender (one language per
--    sender — a new language replaces the previous one).
--  · ""       removes the subscription for that sender (no-op if absent).
-- Senders/languages not mentioned in the delta are left untouched.
--
-- The whole stanza is applied atomically: if any entry fails validation the
-- entire delta is rejected with an error reply and no state changes.
--
-- Processing (on_message):
--  1. The sender must be an occupant of the room identified by the session's
--     jitsi_web_query_room field (set from the WebSocket ?room= URL param).
--  2. If the feature is disabled in RoomMetadata (audioTranslation.enabled ==
--     false) the message is a silent no-op. A missing flag means enabled.
--  3. The receiver must have the 'live-translation-subscribe' permission, which
--     everybody has unless the token explicitly sets it to "false".
--  4. Each entry is validated: senderId is 8 hex digits and a current occupant,
--     language is alphabetical and at most 20 characters (or "" to remove).
--  5. A receiver may hold at most audio_translation_max_subscriptions distinct
--     subscriptions (unlimited by default; set the option to enforce a cap).
--
-- ── Aggregate map (component → jicofo) ───────────────────────────────────────
-- Whenever the set of subscriptions changes, a debounced task recomputes the
-- aggregate { [senderId] = { lang, ... } } (the union of all receivers' requests)
-- and stores it on room._data.audioTranslationRequests, then fires
-- 'room-metadata-changed' so mod_room_metadata_component broadcasts it. That
-- module injects audioTranslationRequests into the metadata only for admin
-- (jicofo) occupants, so regular clients never see it.
--
-- ── Directed listeners push (component → each sender) ─────────────────────────────
-- Alongside the jicofo aggregate, each sender is told which receivers currently translate it.
-- An inverted map { [senderId] = set<receiverId> } is maintained in lockstep with the forward
-- subscription map (updated incrementally on every delta and on occupant-leave), and a directed
-- <translation-listeners xmlns='http://jitsi.org/jitmeet'> message (sorted JSON array) is sent to
-- each sender whose listener set changed, so a client badges the receivers translating the local
-- user. Only senders flagged dirty since the last publish are reconsidered, so the cost is
-- proportional to what changed rather than to room size. Gated exactly like the aggregate; an empty
-- array clears a sender whose last listener left. Handled in publish_listeners(), kept separate so
-- the jicofo-facing publish() is unchanged.
--
-- ── Enable-flag write gating ─────────────────────────────────────────────────
-- The audioTranslation metadata key (which carries the room-level enable flag)
-- is written through mod_room_metadata_component. This module hooks
-- 'jitsi-metadata-allow-moderation' to gate that write behind the
-- 'live-translation' permission (moderators by default) and to sanitise the
-- stored value to { enabled = <bool> }.
--
-- Component "audiotranslation.jitmeet.example.com" "audio_translation_component"
--      muc_component = "conference.jitmeet.example.com"
local json = require 'util.json';
local st = require 'util.stanza';
local jid_resource = require 'util.jid'.resource;
local timer = require 'util.timer';

local util = module:require 'util';
local is_healthcheck_room = util.is_healthcheck_room;
local is_feature_allowed = util.is_feature_allowed;
local get_room_by_name_and_subdomain = util.get_room_by_name_and_subdomain;
local get_occupant_by_real_jid = util.get_occupant_by_real_jid;
local process_host_module = util.process_host_module;

local AUDIO_TRANSLATION_NS = 'http://jitsi.org/jitmeet';
local ELEMENT_NAME = 'audio-translation';

-- RoomMetadata key carrying the room-level enable flag ({ enabled = bool }).
-- Client/preset writable through mod_room_metadata_component; read-only here.
local ENABLED_METADATA_KEY = 'audioTranslation';
-- Aggregate map exposed to jicofo only. Stored on room._data (never in
-- jitsiMetadata) so it is never broadcast to regular clients.
local REQUESTS_METADATA_KEY = 'audioTranslationRequests';

local ENABLE_PERMISSION = 'live-translation';
local SUBSCRIBE_PERMISSION = 'live-translation-subscribe';

local LANG_MAX_LENGTH = 20;

local muc_component_host = module:get_option_string('muc_component');
if muc_component_host == nil then
    module:log('error', 'No muc_component specified. No muc to operate on!');
    return;
end

local main_virtual_host = module:get_option_string('muc_mapper_domain_base');
if not main_virtual_host then
    module:log('warn', 'No muc_mapper_domain_base option set.');
    return;
end

-- Maximum distinct subscriptions a single receiver may hold. Unlimited unless the option is set.
local max_subscriptions = module:get_option_number('audio_translation_max_subscriptions');
-- Coalesce bursts of subscription changes into a single metadata update.
local debounce_interval = module:get_option_number('audio_translation_debounce_interval', 0.5);

module:log('info', 'Starting audio_translation for %s (max_subscriptions=%s, debounce=%ss)',
    muc_component_host, max_subscriptions and tostring(max_subscriptions) or 'unlimited', tostring(debounce_interval));

local main_muc_module;

-- Returns (creating if needed) the per-room translation state:
--   { receivers = { [receiverId] = { [senderId] = lang } },      -- forward map (source of truth)
--     last_published = <json|nil>,                               -- jicofo aggregate dedup
--     listeners_by_sender = { [senderId] = { [receiverId] = true } }, -- inverted map, kept in lockstep
--     dirty_senders = { [senderId] = true },                     -- senders changed since last publish
--     last_sent_listeners = { [senderId] = <json> } }            -- directed-push dedup
-- receivers drives per-receiver atomic updates and the jicofo aggregate; listeners_by_sender is
-- maintained alongside it so the directed per-sender push costs work proportional to what changed.
local function get_state(room)
    if not room._audio_translation then
        room._audio_translation = {
            receivers = {};
            listeners_by_sender = {};
            dirty_senders = {};
            last_sent_listeners = {};
        };
    end

    return room._audio_translation;
end

-- Flags a sender for reconsideration on the next listeners publish.
local function mark_sender_dirty(state, sender_id)
    state.dirty_senders[sender_id] = true;
end

-- Records that receiver_id now translates sender_id in the inverted map, flagging the sender dirty.
local function add_listener(state, sender_id, receiver_id)
    local set = state.listeners_by_sender[sender_id];

    if not set then
        set = {};
        state.listeners_by_sender[sender_id] = set;
    end
    set[receiver_id] = true;
    mark_sender_dirty(state, sender_id);
end

-- Records that receiver_id no longer translates sender_id, dropping the set once it empties and
-- flagging the sender dirty so the change is pushed (an empty set clears the sender).
local function remove_listener(state, sender_id, receiver_id)
    local set = state.listeners_by_sender[sender_id];

    if set then
        set[receiver_id] = nil;
        if next(set) == nil then
            state.listeners_by_sender[sender_id] = nil;
        end
    end
    mark_sender_dirty(state, sender_id);
end

-- Flags every currently-tracked sender dirty. Used when room-wide gating (the enable flag) flips,
-- which changes every sender's pushed list at once with no per-sender delta to key off.
local function mark_all_senders_dirty(state)
    for sender_id in pairs(state.listeners_by_sender) do
        state.dirty_senders[sender_id] = true;
    end
    for sender_id in pairs(state.last_sent_listeners) do
        state.dirty_senders[sender_id] = true;
    end
end

-- The endpoint id of an occupant is the resource part of its in-room nick.
local function endpoint_id(occupant)
    return jid_resource(occupant.nick);
end

-- True unless the feature is explicitly disabled (audioTranslation.enabled == false).
-- A missing audioTranslation key, or a key without an explicit enabled=false,
-- means enabled.
local function is_enabled(room)
    local at = room.jitsiMetadata and room.jitsiMetadata[ENABLED_METADATA_KEY];

    if type(at) == 'table' and at.enabled == false then
        return false;
    end

    return true;
end

-- Everyone may subscribe unless the token explicitly sets the permission to false.
local function subscribe_allowed(session)
    local features = session and session.jitsi_meet_context_features;

    if features then
        local v = features[SUBSCRIBE_PERMISSION];

        if v == false or v == 'false' then
            return false;
        end
    end

    return true;
end

local function is_valid_sender_id(id)
    return type(id) == 'string' and id:match('^%x%x%x%x%x%x%x%x$') ~= nil;
end

local function is_valid_language(lang)
    return type(lang) == 'string' and #lang <= LANG_MAX_LENGTH and lang:match('^%a+$') ~= nil;
end

-- Applies a delta to the receiver's subscription map atomically.
-- Returns true on success, or false plus an (error-type, condition) pair.
local function apply_delta(room, receiver_id, delta)
    local state = get_state(room);
    local current = state.receivers[receiver_id] or {};

    -- Work on a copy so a mid-delta failure leaves the stored map untouched.
    local next_map = {};

    for sender_id, lang in pairs(current) do
        next_map[sender_id] = lang;
    end

    for sender_id, lang in pairs(delta) do
        if not is_valid_sender_id(sender_id) then
            return false, 'modify', 'bad-request';
        end

        if type(lang) ~= 'string' then
            return false, 'modify', 'bad-request';
        end

        if lang == '' then
            -- Removal; benign no-op when the sender is not currently subscribed.
            next_map[sender_id] = nil;
        else
            if not is_valid_language(lang) then
                return false, 'modify', 'bad-request';
            end

            if not room:get_occupant_by_nick(room.jid..'/'..sender_id) then
                return false, 'cancel', 'item-not-found';
            end

            next_map[sender_id] = lang;
        end
    end

    local count = 0;

    for _ in pairs(next_map) do
        count = count + 1;
    end

    if max_subscriptions and count > max_subscriptions then
        return false, 'cancel', 'policy-violation';
    end

    state.receivers[receiver_id] = next_map;

    -- Update the inverted map in lockstep, now that the delta has fully validated (so a rejected
    -- delta never mutates it). Only membership changes move listeners; a language-only change
    -- (sender present before and after) is not a listener change and leaves the sender untouched.
    for sender_id in pairs(current) do
        if not next_map[sender_id] then
            remove_listener(state, sender_id, receiver_id);
        end
    end
    for sender_id in pairs(next_map) do
        if not current[sender_id] then
            add_listener(state, sender_id, receiver_id);
        end
    end

    return true;
end

-- Builds the aggregate { [senderId] = { lang, ... } } (union over all receivers),
-- or nil when there are no subscriptions.
local function compute_aggregate(room)
    local sets = {};
    local any = false;

    for _, subs in pairs(get_state(room).receivers) do
        for sender_id, lang in pairs(subs) do
            local set = sets[sender_id];

            if not set then
                set = {};
                sets[sender_id] = set;
            end
            set[lang] = true;
            any = true;
        end
    end

    if not any then
        return nil;
    end

    local out = {};

    for sender_id, set in pairs(sets) do
        local langs = {};

        for lang in pairs(set) do
            langs[#langs + 1] = lang;
        end
        table.sort(langs);
        out[sender_id] = langs;
    end

    return out;
end

-- Recomputes the aggregate and, when it changed, publishes it to jicofo via
-- RoomMetadata. Stored on room._data so mod_room_metadata_component only forwards
-- it to admin (jicofo) occupants.
-- While the feature is disabled for the room the published map is cleared (nil) so
-- jicofo stops translation; the receivers' subscriptions are kept in memory and
-- republished if the room is re-enabled.
local function publish(room)
    if not room._audio_translation or not main_muc_module then
        return;
    end

    -- Neutral, default-open extension point: an external module may veto publishing
    -- the translation request map by returning false from this event. No handler, or
    -- any non-false return, means allowed. This keeps any gating/entitlement logic out
    -- of this module (open by default). Follows the same false=deny / nil=no-opinion
    -- convention as 'jitsi-metadata-allow-moderation'.
    local allow_publish = main_muc_module:fire_event('jitsi-audio-translation-allow-publish', { room = room; }) ~= false;

    -- The request set the receivers have asked for, independent of gating. Computed
    -- unconditionally so we can tell "nothing requested" apart from "requests suppressed".
    local requested = compute_aggregate(room);
    local aggregate = (allow_publish and is_enabled(room)) and requested or nil;
    local encoded = aggregate and json.encode(aggregate) or nil;

    if encoded == room._audio_translation.last_published then
        return;
    end
    room._audio_translation.last_published = encoded;

    -- Log when we transition to suppressing a non-empty request set (feature disabled for
    -- the room, or an external handler vetoed publishing). Deduped by last_published above,
    -- so this fires on the transition, not on every update. Normally the client hides the
    -- control, so a suppressed request set is worth being able to discover.
    if aggregate == nil and requested ~= nil then
        module:log('warn', 'Not publishing audio-translation requests in room %s: %s', room.jid,
            allow_publish and 'disabled for the room' or 'publishing vetoed by a handler');
    end

    room._data.audioTranslationRequests = aggregate;

    main_muc_module:fire_event('room-metadata-changed', { room = room; });
end

-- Pushes each dirty sender the sorted receiver ids currently translating it, as a directed
-- <translation-listeners> message, then clears the dirty set. Reads the incrementally-maintained
-- inverted map (listeners_by_sender), so the cost is proportional to what changed, not room size.
-- Kept separate from publish() so the jicofo-facing aggregate path stays untouched. Gated like the
-- aggregate: while disabled/vetoed every dirty sender resolves to an empty list. Change-detected per
-- sender against last_sent_listeners; an empty array is sent (then the tracker entry dropped) to
-- clear a sender whose last listener left.
local function publish_listeners(room)
    if not room._audio_translation or not main_muc_module then
        return;
    end

    local state = room._audio_translation;
    local dirty = state.dirty_senders;

    if not dirty or next(dirty) == nil then
        return;
    end
    state.dirty_senders = {};

    local allow_publish = main_muc_module:fire_event('jitsi-audio-translation-allow-publish', { room = room; }) ~= false;
    local enabled = allow_publish and is_enabled(room);

    for sender_id in pairs(dirty) do
        local list = {};
        local set = enabled and state.listeners_by_sender[sender_id];

        if set then
            for receiver_id in pairs(set) do
                list[#list + 1] = receiver_id;
            end
            -- Sorted so set-iteration order never produces a spurious change.
            table.sort(list);
        end

        -- util.json encodes an empty table as "{}"; force "[]" so clients always parse an array.
        local encoded_listeners = (#list > 0) and json.encode(list) or '[]';

        if encoded_listeners ~= state.last_sent_listeners[sender_id] then
            local occupant = room:get_occupant_by_nick(room.jid..'/'..sender_id);

            if occupant then
                module:send(st.message({ from = module.host; to = occupant.jid; })
                    :tag('translation-listeners', { xmlns = AUDIO_TRANSLATION_NS; })
                    :text(encoded_listeners):up());
            end

            -- Only a delivered push is recorded; for a missing occupant the entry is dropped so a
            -- rejoin with the same endpoint id gets a fresh push instead of being change-suppressed.
            if occupant and #list > 0 then
                state.last_sent_listeners[sender_id] = encoded_listeners;
            else
                state.last_sent_listeners[sender_id] = nil;
            end
        end
    end
end

-- Schedules a debounced publish so a burst of updates produces a single metadata
-- broadcast.
local function schedule_publish(room)
    local state = get_state(room);

    if state.publish_scheduled then
        return;
    end
    state.publish_scheduled = true;

    timer.add_task(debounce_interval, function()
        if room._audio_translation then
            room._audio_translation.publish_scheduled = nil;
        end
        publish(room);
        publish_listeners(room);
    end);
end

function on_message(event)
    local origin, stanza = event.origin, event.stanza;

    if stanza.attr.type == 'error' then
        return; -- Do not reply to error stanzas (avoids loops).
    end

    if not origin or not origin.jitsi_web_query_room then
        return false;
    end

    local at = stanza:get_child(ELEMENT_NAME, AUDIO_TRANSLATION_NS);

    if not at then
        return true; -- Not for us.
    end

    local body = at:get_text();

    if not body or body == '' then
        return true;
    end

    local room = get_room_by_name_and_subdomain(
        origin.jitsi_web_query_room, origin.jitsi_web_query_prefix or '');

    if not room then
        module:log('warn', 'No room found for %s/%s',
            origin.jitsi_web_query_prefix, origin.jitsi_web_query_room);
        origin.send(st.error_reply(stanza, 'cancel', 'item-not-found'));

        return true;
    end

    local from = stanza.attr.from;
    local occupant = get_occupant_by_real_jid(room, from);

    if not occupant then
        module:log('warn', '%s is not an occupant of %s', from, room.jid);
        origin.send(st.error_reply(stanza, 'auth', 'forbidden'));

        return true;
    end

    -- Disabled for the room → no-op. Log it: the client normally hides the control when
    -- translation is disabled, so a subscription arriving here is unexpected and worth
    -- being able to discover.
    if not is_enabled(room) then
        module:log('warn', 'Ignoring audio-translation subscription from %s: disabled for room %s', from, room.jid);
        return true;
    end

    if not subscribe_allowed(origin) then
        module:log('warn', '%s is not allowed to subscribe to translations in %s', from, room.jid);
        origin.send(st.error_reply(stanza, 'auth', 'forbidden'));

        return true;
    end

    local delta = json.decode(body);

    if type(delta) ~= 'table' then
        module:log('warn', 'Invalid audio_translation payload from %s: %s', from, body);
        origin.send(st.error_reply(stanza, 'modify', 'bad-request'));

        return true;
    end

    local ok, err_type, err_condition = apply_delta(room, endpoint_id(occupant), delta);

    if not ok then
        origin.send(st.error_reply(stanza, err_type, err_condition));

        return true;
    end

    schedule_publish(room);

    return true;
end

module:hook('message/host', on_message);

function process_main_muc_loaded(main_muc, host_module)
    main_muc_module = host_module;

    module:log('info', 'Hooked audio_translation to muc events on %s', muc_component_host);

    -- Prune subscriptions when an occupant leaves: drop the leaver's own
    -- subscriptions (receiver) and remove it as a sender from everyone else.
    host_module:hook('muc-occupant-left', function(event)
        local room, occupant = event.room, event.occupant;

        if not room._audio_translation or is_healthcheck_room(room.jid) then
            return;
        end

        local state = room._audio_translation;
        local id = endpoint_id(occupant);
        local changed = false;

        -- As a receiver: drop its own subscriptions, removing it as a listener from each sender it
        -- was translating (which flags those senders dirty so their pushed lists shrink).
        local own = state.receivers[id];

        if own then
            state.receivers[id] = nil;
            for sender_id in pairs(own) do
                remove_listener(state, sender_id, id);
            end
            changed = true;
        end

        -- As a sender: remove it from every receiver's map, then forget its listener set entirely.
        -- It has left, so there is no one to notify — dropping the tracking prevents a leak and a
        -- stale re-push, and needs no dirty flag.
        for _, subs in pairs(state.receivers) do
            if subs[id] then
                subs[id] = nil;
                changed = true;
            end
        end
        if state.listeners_by_sender[id] or state.last_sent_listeners[id] then
            state.listeners_by_sender[id] = nil;
            state.last_sent_listeners[id] = nil;
            state.dirty_senders[id] = nil;
            changed = true;
        end

        if changed then
            schedule_publish(room);
        end
    end);

    -- React when the room-level enable flag is toggled: republish so the aggregate
    -- map is cleared when disabled (translation stops) or restored when re-enabled.
    host_module:hook('jitsi-metadata-updated', function(event)
        local room = event.room;

        if event.key == ENABLED_METADATA_KEY and room._audio_translation
                and not is_healthcheck_room(room.jid) then
            -- Room-wide gating changes every sender's pushed list at once, with no per-sender delta,
            -- so flag them all for the listeners pass (publish() recomputes the aggregate itself).
            mark_all_senders_dirty(room._audio_translation);
            schedule_publish(room);
        end
    end);
end

process_host_module(muc_component_host, function(host_module, host)
    local muc_module = prosody.hosts[host].modules.muc;

    if muc_module then
        process_main_muc_loaded(muc_module, host_module);
    else
        module:log('debug', 'Will wait for muc to be available');
        prosody.hosts[host].events.add_handler('module-loaded', function(event)
            if event.module == 'muc' then
                process_main_muc_loaded(prosody.hosts[host].modules.muc, host_module);
            end
        end);
    end
end);

-- Advertise the component as a disco identity on the main virtual host so
-- clients can discover it (handled by mod_features_identity), and gate writes to
-- the audioTranslation enable flag behind the 'live-translation' permission
-- (moderators by default) while sanitising the stored value.
process_host_module(main_virtual_host, function(host_module)
    module:context(host_module.host):fire_event('jitsi-add-identity', {
        name = ELEMENT_NAME; host = module.host;
    });

    host_module:hook('jitsi-metadata-allow-moderation', function(event)
        if event.key ~= ENABLED_METADATA_KEY then
            return; -- No opinion on other keys.
        end

        local session = event.session;
        local is_moderator = event.actor and event.actor.role == 'moderator';
        local features = session and session.jitsi_meet_context_features;

        if not is_feature_allowed(ENABLE_PERMISSION, features, is_moderator) then
            return false;
        end

        local data = event.data;
        local enabled = type(data) == 'table' and (data.enabled == true or data.enabled == 'true');

        return { enabled = enabled };
    end);
end);
