-- global module
-- validates certificates for all hosts used for s2soutinjection or s2sout_override
module:set_global();

local s2s_overrides = module:get_option("s2s_connect_overrides");

if not s2s_overrides then
    s2s_overrides = module:get_option("s2sout_override");
end

function attach(event)
    local session = event.session;

    if s2s_overrides and s2s_overrides[event.host] then
        session.cert_chain_status = 'valid';
        session.cert_identity_status = 'valid';

        return true;
    end
end
module:wrap_event('s2s-check-certificate', function (handlers, event_name, event_data)
    return attach(event_data);
end);
