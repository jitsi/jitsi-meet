local conference_duration_component
    = module:get_option_string(
        "conference_duration_component", "conferenceduration"..module.host);

module:add_identity("component", "conference_duration", conference_duration_component);
