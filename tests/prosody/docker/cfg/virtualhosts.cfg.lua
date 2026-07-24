-- VirtualHost blocks fragment. See prosody.cfg.lua for the fragment layout.

VirtualHost "localhost"
    authentication = "token"
    app_id = "jitsi"
    asap_key_server = "http://localhost:5280/test-observer/asap-keys"
    signature_algorithm = "RS256"
    allow_empty_token = true

    -- Serve test_observer HTTP endpoints here so plain HTTP on port 5280 is
    -- reachable. Component HTTP routes end up on HTTPS 5281 due to Prosody's
    -- virtual-host routing, which does not match Host: localhost on port 5280.
    modules_enabled = {
        -- test-only: HTTP endpoints and census helpers
        "test_observer_http";
        "muc_size";
        "muc_census";
        -- Module order below follows prod (conference.8x8.vc VirtualHost) so that
        -- same-priority hook execution order matches production.
        -- Handles 'jitsi-add-identity' so components (room_metadata,
        -- audio_translation, ...) can advertise a disco identity on this host.
        "features_identity";
        "conference_duration";
        "filter_iq_rayo";    -- priority 1 on pre-iq/full; listed before filter_iq_jibri (matches prod)
        "filter_iq_jibri";
        "muc_lobby_rooms";
        "jiconop";
        "muc_kick_participant";
        "muc_jigasi_invite";
        -- Loaded here so that the global jitsi-access-ban-check event handler
        -- is registered and mod_auth_token can fire it for token-authenticated
        -- sessions. muc_prosody_jitsi_access_manager_url points at the mock
        -- access manager served by mod_test_observer_http on the same host.
        "muc_auth_ban";
        -- test-only
        "turncredentials_http";
        -- Rewrites MUC JIDs between external subdomain form
        -- (room@conference.sub.localhost) and internal bracket form
        -- ([sub]room@conference.localhost) for all sessions on all hosts.
        "muc_domain_mapper";
        "persistent_lobby";
        "system_chat_message";
        -- test-only
        "muc_password_check";
    }

    -- mod_muc_password_check: verify Bearer tokens with the login ASAP key server.
    enable_password_token_verification = true

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

-- VirtualHost for Jibri (recorder) and transcriber accounts used by
-- mod_muc_cleanup_backend_services tests. Accounts on this domain get JIDs whose
-- bare form starts with 'recorder@recorder.' or 'transcriber@recorder.', satisfying
-- is_jibri() and is_transcriber() respectively.
-- recorder.localhost is added to muc_access_whitelist on the MUC component so
-- these clients bypass token_verification without needing JWT tokens.
VirtualHost "recorder.localhost"
    authentication = "internal_hashed"
    disable_sasl_mechanisms = { "SCRAM-SHA-1", "SCRAM-SHA-1-PLUS", "SCRAM-SHA-256", "SCRAM-SHA-256-PLUS" }

-- VirtualHost for HS256 (shared-secret) token auth tests and mod_presence_identity tests.
VirtualHost "hs256.localhost"
    authentication = "token"
    app_id = "jitsi"
    app_secret = "testsecret"
    signature_algorithm = "HS256"
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
