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
}

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
    }

    -- Required by mod_test_observer_http to locate the shared MUC data.
    muc_mapper_domain_base = "localhost"
    muc_mapper_domain_prefix = "conference"

    -- Required by mod_conference_duration to find the MUC component.
    main_muc = "conference.localhost"

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

-- VirtualHost for HS256 (shared-secret) token auth tests.
VirtualHost "hs256.localhost"
    authentication = "token"
    app_id = "jitsi"
    app_secret = "testsecret"
    signature_algorithm = "HS256"
    asap_require_room_claim = false
    allow_empty_token = false

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

Component "conference.localhost" "muc"
    modules_enabled = {
        "muc_hide_all";
        "muc_max_occupants";
        "muc_meeting_id";
        "muc_resource_validate";
        "muc_password_whitelist";
        "token_verification";
        "test_observer";
    }

    anonymous_strict = false

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

-- Minimal MUC component used to test mod_muc_filter_access in isolation.
-- Only clients from whitelist.localhost are permitted to join rooms here.
Component "conference-internal.localhost" "muc"
    modules_enabled = {
        "muc_filter_access";
    }
    muc_filter_whitelist = { "whitelist.localhost" }

-- VirtualHost whose MUC component is conference.test.localhost.
-- Used by mod_token_verification tests that need token_verification_require_token_for_moderation.
-- Naming convention: conference.<parent>.localhost so token/util.lib.lua resolves parentHostName
-- as "test.localhost" and builds muc_domain = "conference.test.localhost" for room lookups.
VirtualHost "test.localhost"
    authentication = "token"
    app_id = "jitsi"
    asap_key_server = "http://localhost:5280/test-observer/asap-keys"
    signature_algorithm = "RS256"
    allow_empty_token = true
    asap_require_room_claim = false
    -- Test JWTs carry no 'sub' claim so skip domain verification (tests only check room name).
    enable_domain_verification = false

    -- token/util.lib.lua constructs muc_domain = prefix.base = "conference.test.localhost"
    muc_mapper_domain_base = "test.localhost"
    muc_mapper_domain_prefix = "conference"

-- MUC component for token_verification_require_token_for_moderation tests.
-- token_verification_require_token_for_moderation = true blocks unauthenticated
-- users from sending room-owner config IQs (which is how moderator status is
-- granted to other participants).
-- focus@auth.localhost is a Prosody admin and is therefore exempt from both
-- the join check and the require_token_for_moderation IQ check.
Component "conference.test.localhost" "muc"
    modules_enabled = {
        "muc_meeting_id";
        "token_verification";
    }
    token_verification_require_token_for_moderation = true

    muc_mapper_domain_base = "test.localhost"
    muc_mapper_domain_prefix = "conference"
