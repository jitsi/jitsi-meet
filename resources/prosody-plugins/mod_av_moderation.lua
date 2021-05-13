local avmoderation_component = module:get_option_string('av_moderation_component', 'avmoderation'..module.host);

-- Advertise AV Moderation so client can pick up the address and use it
module:add_identity('component', 'av_moderation', avmoderation_component);

module:depends("jitsi_session");
