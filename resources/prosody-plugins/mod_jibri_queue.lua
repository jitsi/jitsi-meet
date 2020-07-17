local jibri_queue_component
    = module:get_option_string(
        "jibri_queue_component", "jibriqueue"..module.host);

module:add_identity("component", "jibri-queue", jibri_queue_component);