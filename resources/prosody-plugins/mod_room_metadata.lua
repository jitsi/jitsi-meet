-- TODO: Remove this file after several stable releases when people update their configs
module:log('warn', 'mod_room_metadata is deprecated and will be removed in a future release. '
    .. 'Please update your config by removing this module from the list of loaded modules.');

module:depends("jitsi_session");
module:depends("features_identity");
