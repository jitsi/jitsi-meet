-- This module makes all MUCs in Prosody unavailable on disco#items query
-- Copyright (C) 2023-present 8x8, Inc.

module:hook("muc-room-pre-create", function(event)
    event.room:set_hidden(true);
end, -1);
