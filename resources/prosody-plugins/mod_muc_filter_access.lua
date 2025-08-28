-- Restricts access to a muc component to certain domains
-- Copyright (C) 2023-present 8x8, Inc.

-- a list of (authenticated)domains that can access rooms(send presence)
local whitelist = module:get_option_set("muc_filter_whitelist");

if not whitelist then
    module:log("warn", "No 'muc_filter_whitelist' option set, disabling muc_filter_access, plugin inactive");
    return
end

local jid_split = require "util.jid".split;

local function incoming_presence_filter(event)
    local stanza = event.stanza;
    local _, domain, _ = jid_split(stanza.attr.from);

    if not stanza.attr.from or not whitelist:contains(domain) then
        -- Filter presence
        module:log("error", "Filtering unauthorized presence: %s", stanza:top_tag());
        return true;
    end
end

for _, jid_type in ipairs({ "host", "bare", "full" }) do
    module:hook("presence/"..jid_type, incoming_presence_filter, 2000);
end
