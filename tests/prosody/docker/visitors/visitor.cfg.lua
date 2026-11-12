-- A visitor node (v0) for visitors_s2s_spec.js, based on
-- resources/extra-large-conference/prosody.cfg.lua.visitor.template. Its main
-- prosody is main.test (see main.cfg.lua).

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
http_ports = { 5280 }
http_interfaces = { "*" }
https_ports = {}

muc_mapper_domain_base = "v0.meet.jitsi"
main_domain = "main.test"

s2s_whitelist = {
    "conference.main.test";
    "visitors.main.test";
    "main.test";
    "polls.main.test";
}
-- The docker service of the main prosody. A shard uses 127.0.0.1:5269.
s2sout_override = {
    ["main.test"] = "tcp://main:5269";
    ["conference.main.test"] = "tcp://main:5269";
    ["visitors.main.test"] = "tcp://main:5269";
    ["polls.main.test"] = "tcp://main:5269";
}

VirtualHost "v0.meet.jitsi"
    authentication = "jitsi-anonymous"
    main_muc = "conference.v0.meet.jitsi"

Component "conference.v0.meet.jitsi" "muc"
    restrict_room_creation = true
    muc_room_locking = false
    modules_enabled = {
        "fmuc";
        "s2s_bidi";
        "s2s_whitelist";
        "s2sout_override";
    }
