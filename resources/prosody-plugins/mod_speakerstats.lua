local speakerstats_component
    = module:get_option_string(
        "speakerstats_component", "speakerstats"..module.host);

-- Advertise speaker stats so client can pick up the address and start sending
-- dominant speaker events
module:add_identity("component", "speakerstats", speakerstats_component);
