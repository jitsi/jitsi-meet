-- Generic room metadata
-- See mod_room_metadata_component.lua

local COMPONENT_IDENTITY_TYPE = 'room_metadata';
local room_metadata_component_host = module:get_option_string('room_metadata_component', 'metadata.'..module.host);

module:depends("jitsi_session");

-- Advertise the component so clients can pick up the address and use it
module:add_identity('component', COMPONENT_IDENTITY_TYPE, room_metadata_component_host);
