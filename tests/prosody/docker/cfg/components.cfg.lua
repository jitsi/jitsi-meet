-- Component blocks fragment (all Components except conference.localhost).
-- See prosody.cfg.lua for the fragment layout.

Component "lobby.conference.localhost" "muc"
    storage = "memory"
    muc_room_cache_size = 1000
    restrict_room_creation = true
    muc_room_locking = false
    muc_room_default_public_jids = true

-- Internal MUC used by mod_muc_jigasi_invite: the module resolves the Jigasi
-- brewery room from this component via process_host_module. Without this
-- component main_muc_service would remain nil and requests that reach the
-- invite_jigasi() path would crash instead of returning 404.
Component "internal.auth.localhost" "muc"

-- Minimal MUC component used to test mod_muc_filter_access in isolation.
-- Only clients from whitelist.localhost are permitted to join rooms here.
Component "conference-internal.localhost" "muc"
    modules_enabled = {
        "muc_filter_access";
    }
    muc_filter_whitelist = { "whitelist.localhost" }

-- Component for mod_end_conference tests. Clients send a message stanza with
-- an <end_conference/> child to this component; the module looks up the room
-- from the sender's jitsi_web_query_room session field (set by mod_jitsi_session
-- from the ?room= WebSocket URL param) and destroys it if the sender is a
-- moderator occupant.
Component "endconference.localhost" "end_conference"
    muc_component = "conference.localhost"
    muc_mapper_domain_base = "localhost"
    muc_mapper_domain_prefix = "conference"

-- MUC component for mod_muc_rate_limit integration tests.
-- Intentionally low join/leave rates (1/s) so that 5 simultaneous clients
-- exercise the queuing and timer logic without long waits.
Component "rate-limited.localhost" "muc"
    modules_enabled = { "muc_rate_limit" }
    muc_rate_joins = 1
    muc_rate_leaves = 1

-- Metadata component for mod_room_metadata_component tests.
Component "metadata.localhost" "room_metadata_component"
    muc_component = "conference.localhost"
    muc_mapper_domain_base = "localhost"
    muc_mapper_domain_prefix = "conference"

-- Component for mod_filesharing_component tests. Clients send file-sharing
-- messages here; the component looks up the room from jitsi_web_query_room
-- (set by mod_jitsi_session) and broadcasts add/remove notifications.
Component "filesharing.localhost" "filesharing_component"
    muc_component = "conference.localhost"
    muc_mapper_domain_base = "localhost"
    muc_mapper_domain_prefix = "conference"

-- Component for mod_audio_translation_component tests. Receivers send
-- <audio-translation> messages here; the component aggregates per-receiver
-- subscriptions and exposes the map to jicofo via room._data.audioTranslationRequests
-- (forwarded by mod_room_metadata_component on the metadata.localhost component).
Component "audiotranslation.localhost" "audio_translation_component"
    muc_component = "conference.localhost"
    muc_mapper_domain_base = "localhost"
    muc_mapper_domain_prefix = "conference"
    -- Short debounce so tests don't wait long for the aggregate broadcast.
    audio_translation_debounce_interval = 0.1
    -- Low limit so the per-receiver cap is exercised without many subscriptions.
    audio_translation_max_subscriptions = 3

-- Component for mod_polls_component tests. The module hooks message/host for
-- new-poll / answer-poll json-messages, keeps per-room poll state (installed on
-- conference.localhost via process_host_module) and re-broadcasts poll updates
-- to all occupants. The sender must be an occupant of the room, located from
-- jitsi_web_query_room (set by mod_jitsi_session from the ?room= param).
Component "polls.localhost" "polls_component"
    muc_mapper_domain_base = "localhost"
    muc_mapper_domain_prefix = "conference"

-- Plain MUC for mod_presence_identity tests. No token verification and no
-- muc_meeting_id lock so any client can join freely without focus.
Component "conference-identity.localhost" "muc"

-- Isolated MUC component for mod_muc_wait_for_host tests.
-- No muc_meeting_id, so no jicofo lock — a JWT-authenticated client can join
-- directly as host without focus unlocking the room first.
-- muc_mapper_domain_base is set to "conference.localhost" so that:
--   lobby_muc_component_config = "lobby." .. "conference.localhost"
--                              = "lobby.conference.localhost"   (already configured above)
-- This means the existing lobby component is reused for the lobby rooms created
-- by this component, and no additional lobby MUC component is needed.
Component "conference-waitforhost.localhost" "muc"
    storage = "memory"
    modules_enabled = {
        "muc_wait_for_host";
    }
    muc_mapper_domain_base = "conference.localhost"
    muc_mapper_domain_prefix = "conference"

-- Isolated MUC component for mod_muc_allowners tests.
-- No muc_meeting_id (no jicofo lock) and no token_verification, so anonymous
-- clients can join freely. In non-moderated rooms every occupant is promoted
-- to owner on join and muc#admin set stanzas revoking affiliations are
-- rejected. Room names listed in allowners_moderated_rooms are moderated:
-- only JWT-authenticated users with a matching room claim are promoted and
-- the revoke filtering is skipped.
Component "conference-allowners.localhost" "muc"
    storage = "memory"
    modules_enabled = {
        "muc_allowners";
    }
    muc_mapper_domain_base = "localhost"
    muc_mapper_domain_prefix = "conference"
    allowners_moderated_rooms = { "moderated-room-1"; "moderated-room-2" }
