-- Minimal Prosody config for integration testing.
-- No TLS: tests connect plaintext over loopback.
-- Anonymous auth: no user provisioning needed.

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
}

c2s_require_encryption = false
s2s_require_encryption = false
allow_unencrypted_plain_auth = true

-- HTTP server for mod_test_observer_http endpoints.
-- Disable HTTPS so all HTTP routes land on port 5280 (not 5281).
http_ports = { 5280 }
http_interfaces = { "*" }
https_ports = {}

VirtualHost "localhost"
    authentication = "anonymous"

    -- Serve test_observer HTTP endpoints here so plain HTTP on port 5280 is
    -- reachable. Component HTTP routes end up on HTTPS 5281 due to Prosody's
    -- virtual-host routing, which does not match Host: localhost on port 5280.
    modules_enabled = {
        "test_observer_http";
    }

    -- Required by mod_test_observer_http to locate the shared MUC data.
    muc_mapper_domain_base = "localhost"
    muc_mapper_domain_prefix = "conference"

Component "conference.localhost" "muc"
    modules_enabled = {
        "muc_hide_all";
        "muc_max_occupants";
        "test_observer";
    }

    -- Used by mod_muc_max_occupants tests (2 occupants max).
    muc_max_occupants = 2

    -- Required by util.lib.lua domain-mapping helpers.
    muc_mapper_domain_base = "localhost"
    muc_mapper_domain_prefix = "conference"
