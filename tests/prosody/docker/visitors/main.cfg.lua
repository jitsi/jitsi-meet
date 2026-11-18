-- The main prosody for visitors_s2s_spec.js. Only what the s2s path from a
-- visitor node needs: the main room is on conference.main.test and the visitor
-- node is v0.meet.jitsi (see visitor.cfg.lua). No TLS, s2s uses dialback.

data_path = "/var/lib/prosody"
pid_file = "/var/run/prosody/prosody.pid"
plugin_paths = { "/usr/lib/prosody/modules", "/opt/prosody-jitsi-plugins" }
log = { { levels = { min = "debug" }, to = "console" } }

modules_enabled = {
    "saslauth";
    "disco";
    "ping";
    "admin_shell";
    "http";
    "websocket";
    "dialback";
    "s2s_bidi";
    "s2s_whitelist";
    "s2sout_override";
}

consider_websocket_secure = true
c2s_require_encryption = false
s2s_require_encryption = false
s2s_secure_auth = false
allow_unencrypted_plain_auth = true
http_ports = { 5280 }
http_interfaces = { "*" }
https_ports = {}

admins = { "focus@auth.main.test" }
muc_mapper_domain_base = "main.test"
muc_mapper_domain_prefix = "conference"

-- As on the main prosody of a shard: the components of the visitor nodes.
s2s_whitelist = {
    "conference.v0.meet.jitsi";
    "polls.v0.meet.jitsi";
}
-- The docker service of the visitor node. A shard uses 127.0.0.1 and a port per node.
s2sout_override = {
    ["v0.meet.jitsi"] = "tcp://visitor:5269";
    ["conference.v0.meet.jitsi"] = "tcp://visitor:5269";
    ["polls.v0.meet.jitsi"] = "tcp://visitor:5269";
}

VirtualHost "main.test"
    authentication = "token"
    app_id = "jitsi"
    app_secret = "testsecret"
    allow_empty_token = true

VirtualHost "auth.main.test"
    authentication = "internal_hashed"
    -- PLAIN only, as on auth.localhost in cfg/virtualhosts.cfg.lua: @xmpp/sasl 0.13 does not work with
    -- the SCRAM mechanisms of Prosody 13.
    disable_sasl_mechanisms = { "SCRAM-SHA-1", "SCRAM-SHA-1-PLUS", "SCRAM-SHA-256", "SCRAM-SHA-256-PLUS" }

Component "conference.main.test" "muc"
    restrict_room_creation = true
    muc_room_locking = false
    modules_enabled = {
        "token_verification";
        -- A component does not inherit the global s2s_whitelist module.
        "s2s_whitelist";
        "s2sout_override";
    }
