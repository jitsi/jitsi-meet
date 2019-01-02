local polls_component = module:get_option_string("polls_component", "polls"..module.host);
module:add_identity("component", "polls", polls_component);
