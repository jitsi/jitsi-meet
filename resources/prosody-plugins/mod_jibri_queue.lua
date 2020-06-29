local jibri_queue_component
    = module:get_option_string(
        "jibri_queue_component", "jibri_queue"..module.host);

module:add_identity("component", "jibri_queue", jibri_queue_component);