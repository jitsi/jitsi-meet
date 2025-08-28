-- Enables dial-in for Jitsi meet components customers
VirtualHost "jigasi.meet.jitsi"
    modules_enabled = {
        "ping";
        "bosh";
        "muc_password_check";
    }
    authentication = "token"
    app_id = "jitsi";
    asap_key_server = "https://jaas-public-keys.jitsi.net/jitsi-components/prod-8x8"
    asap_accepted_issuers = { "jaas-components" }
    asap_accepted_audiences = { "jigasi.jitmeet.example.com" }
