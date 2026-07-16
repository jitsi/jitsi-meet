-- Global settings fragment. See prosody.cfg.lua for the fragment layout.
--
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
