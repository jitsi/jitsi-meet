-- Minimal Prosody config for integration testing.
-- No TLS: tests connect plaintext over loopback.

data_path = "/var/lib/prosody"
pid_file = "/var/run/prosody/prosody.pid"

plugin_paths = { "/usr/lib/prosody/modules", "/opt/prosody-jitsi-plugins" }

log = {
    { levels = { min = "debug" }, to = "console" };
}

-- No TLS module means no STARTTLS offered, so clients connect plaintext.
modules_enabled = {
    "saslauth";
    "disco";
    "ping";
    "admin_shell";
    "http";
    "websocket";
    "smacks";
    -- Global HTTP API modules.
    "muc_end_meeting";
    -- Sets jitsi_web_query_room on sessions from the ?room= WebSocket URL param;
    -- required by mod_end_conference to locate the target MUC room.
    "jitsi_session";
}

-- Required by mod_muc_end_meeting (global module) to locate the MUC component
-- and to attach its HTTP handler to the correct VirtualHost.
muc_mapper_domain_base = "localhost"
muc_mapper_domain_prefix = "conference"

-- System token key server for mod_muc_end_meeting and similar HTTP API modules.
-- These tokens are signed with a separate key pair from login tokens, providing
-- key-level separation between user-facing and system-facing authentication.
-- The endpoint is served by mod_test_observer_http at /test-observer/system-asap-keys/.
prosody_password_public_key_repo_url = "http://localhost:5280/test-observer/system-asap-keys"

-- Allow WebSocket connections without TLS (tests run over loopback).
consider_websocket_secure = true

c2s_require_encryption = false
s2s_require_encryption = false
allow_unencrypted_plain_auth = true

-- HTTP server for mod_test_observer_http endpoints.
-- Disable HTTPS so all HTTP routes land on port 5280 (not 5281).
http_ports = { 5280 }
http_interfaces = { "*" }
https_ports = {}

-- The focus (jicofo) test helper authenticates as focus@auth.localhost.
-- Prosody admins are exempt from token_verification checks and are used as
-- room owners, mirroring production where jicofo is a Prosody admin.
admins = { "focus@auth.localhost" }

VirtualHost "localhost"
    authentication = "token"
    app_id = "jitsi"
    asap_key_server = "http://localhost:5280/test-observer/asap-keys"
    signature_algorithm = "RS256"
    allow_empty_token = true
    -- Match production: room claim not required.
    asap_require_room_claim = false

    -- Serve test_observer HTTP endpoints here so plain HTTP on port 5280 is
    -- reachable. Component HTTP routes end up on HTTPS 5281 due to Prosody's
    -- virtual-host routing, which does not match Host: localhost on port 5280.
    modules_enabled = {
        "test_observer_http";
        "muc_size";
        "muc_census";
        "conference_duration";
        "filter_iq_jibri";
        "filter_iq_rayo";
        "muc_kick_participant";
        "system_chat_message";
        "muc_jigasi_invite";
        -- Loaded here so that the global jitsi-access-ban-check event handler
        -- is registered and mod_auth_token can fire it for token-authenticated
        -- sessions. muc_prosody_jitsi_access_manager_url points at the mock
        -- access manager served by mod_test_observer_http on the same host.
        "muc_auth_ban";
        "turncredentials_http";
        "jiconop";
        -- Rewrites MUC JIDs between external subdomain form
        -- (room@conference.sub.localhost) and internal bracket form
        -- ([sub]room@conference.localhost) for all sessions on all hosts.
        "muc_domain_mapper";
        "muc_lobby_rooms";
    }

    shard_name = "test-shard"
    region_name = "test-region"
    release_number = "test-release"

    -- mod_turncredentials_http (HTTP via external_services): port 3479.
    external_services = {
        { type = "stun", host = "127.0.0.1", port = 3479 };
        { type = "turn", host = "127.0.0.1", port = 3479, secret = "http-turn-secret" };
    }

    -- Required by mod_muc_auth_ban: URL of the access manager to call.
    -- Points at the mock endpoint served by mod_test_observer_http.
    muc_prosody_jitsi_access_manager_url = "http://localhost:5280/test-observer/access-manager"

    -- Required by mod_test_observer_http to locate the shared MUC data.
    muc_mapper_domain_base = "localhost"
    muc_mapper_domain_prefix = "conference"

    -- Required by mod_conference_duration to find the MUC component.
    -- Required by mod_muc_lobby_rooms.
    main_muc = "conference.localhost"
    lobby_muc = "lobby.conference.localhost"

    -- Clients on whitelist.localhost bypass the lobby.
    muc_lobby_whitelist = { "whitelist.localhost" }

-- VirtualHost for the focus (jicofo) test helper.
-- Clients authenticate with username "focus" and password "focussecret".
-- The account is pre-created in the Docker image (see Dockerfile).
-- focus@auth.localhost is listed in the global admins table, so it is exempt
-- from token_verification and can act as room owner on all MUC components.
VirtualHost "auth.localhost"
    authentication = "internal_hashed"
    -- @xmpp/sasl (v0.13) does not await async SASL responses; the SCRAM-SHA-1
    -- mechanism in sasl-scram-sha-1 1.4+ is async, so the client sends an
    -- empty client-final message which Prosody rejects as malformed-request.
    -- Disable SCRAM and force PLAIN (safe on loopback in the test environment).
    disable_sasl_mechanisms = { "SCRAM-SHA-1", "SCRAM-SHA-1-PLUS", "SCRAM-SHA-256", "SCRAM-SHA-256-PLUS" }

-- VirtualHost for HS256 (shared-secret) token auth tests and mod_presence_identity tests.
VirtualHost "hs256.localhost"
    authentication = "token"
    app_id = "jitsi"
    app_secret = "testsecret"
    signature_algorithm = "HS256"
    asap_require_room_claim = false
    allow_empty_token = false
    modules_enabled = { "presence_identity" }

-- Second VirtualHost whose domain is listed in muc_access_whitelist on the
-- MUC component below. Clients connecting here get JIDs like
-- <random>@whitelist.localhost and are treated as whitelisted.
-- VirtualHost used by mod_auth_jitsi-anonymous tests.
VirtualHost "jitsi-anonymous.localhost"
    authentication = "jitsi-anonymous"

-- VirtualHost used by mod_auth_jitsi-shared-secret tests.
VirtualHost "shared-secret.localhost"
    authentication = "jitsi-shared-secret"
    shared_secret = "topsecret"
    shared_secret_prev = "oldsecret"
    -- Disable SCRAM so Prosody only offers PLAIN. SCRAM requires per-user key
    -- derivation which is incompatible with a shared-secret auth provider.
    disable_sasl_mechanisms = { "SCRAM-SHA-1", "SCRAM-SHA-1-PLUS" }

VirtualHost "whitelist.localhost"
    authentication = "anonymous"

-- VirtualHost for mod_turncredentials tests. Kept separate from the main
-- VirtualHost because external_services (loaded by mod_turncredentials_http)
-- hooks the same extdisco IQ event and would otherwise take precedence.
VirtualHost "turncredentials.localhost"
    authentication = "anonymous"
    modules_enabled = { "turncredentials" }
    turncredentials_secret = "xmpp-turn-secret"
    turncredentials = {
        { type = "stun", host = "127.0.0.1", port = 3478 };
        { type = "turn", host = "127.0.0.1", port = 3478 };
    }

Component "lobby.conference.localhost" "muc"
    storage = "memory"
    muc_room_cache_size = 1000
    restrict_room_creation = true
    muc_room_locking = false
    muc_room_default_public_jids = true

Component "conference.localhost" "muc"
    modules_enabled = {
        "muc_hide_all";
        "muc_max_occupants";
        "muc_meeting_id";
        "muc_resource_validate";
        "muc_password_whitelist";
        "token_verification";
        "token_affiliation";
        "muc_flip";
        "test_observer";
    }

    anonymous_strict = true

    -- Used by mod_muc_max_occupants tests (2 occupants max).
    muc_max_occupants = 2

    -- Clients on whitelist.localhost bypass the occupant limit.
    -- Clients on auth.localhost are the focus (jicofo) admin; they also bypass
    -- the limit and are not counted against it.
    muc_access_whitelist = { "whitelist.localhost", "auth.localhost" }

    -- Used by mod_muc_password_whitelist tests: clients from whitelist.localhost
    -- are injected with the room password and bypass the password check.
    muc_password_whitelist = { "whitelist.localhost" }

    -- Required by util.lib.lua domain-mapping helpers and mod_jitsi_permissions.
    muc_mapper_domain_base = "localhost"
    muc_mapper_domain_prefix = "conference"

    -- focus@auth.localhost is a Prosody admin and is therefore exempt from
    -- token_verification on both muc-room-pre-create and muc-occupant-pre-join,
    -- mirroring production where jicofo is a Prosody admin.

    -- Blocks unauthenticated users from sending room-owner config IQs
    -- (muc#owner queries), which is how moderator status is granted to other
    -- participants and how room configuration is changed.
    token_verification_require_token_for_moderation = true

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

-- Plain MUC for mod_presence_identity tests. No token verification and no
-- muc_meeting_id lock so any client can join freely without focus.
Component "conference-identity.localhost" "muc"
