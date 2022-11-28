-- validates all certificates, global module
-- Warning: use this only for testing purposes as it will accept all kind of certificates for s2s connections
-- you can use https://modules.prosody.im/mod_s2s_whitelist.html for whitelisting only certain destinations
module:set_global();

function attach(event)
    local session = event.session;

    session.cert_chain_status = 'valid';
    session.cert_identity_status = 'valid';

    return true;
end
module:wrap_event('s2s-check-certificate', function (handlers, event_name, event_data)
    return attach(event_data);
end);
