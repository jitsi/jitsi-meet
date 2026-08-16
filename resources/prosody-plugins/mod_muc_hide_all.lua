-- Hides all MUC rooms from disco#items queries on the MUC component, so that
-- room enumeration by external clients is prevented. Rooms are still joinable
-- by full JID; they simply do not appear in the public room list.
-- This module is enabled under the MUC component.
-- Copyright (C) 2023-present 8x8, Inc.
local jid = require 'util.jid';
local st = require 'util.stanza';

local util = module:require 'util';
local get_room_from_jid = util.get_room_from_jid;

module:hook('muc-room-pre-create', function(event)
    event.room:set_hidden(true);
end, -1);

for _, event_name in pairs {
        'iq-get/bare/http://jabber.org/protocol/disco#info:query';
        'iq-get/host/http://jabber.org/protocol/disco#info:query';
} do
    module:hook(event_name, function (event)
        local origin, stanza = event.origin, event.stanza;
        local room_jid = jid.bare(stanza.attr.to);
        local room = get_room_from_jid(room_jid);

        if room then
            if not room:get_occupant_by_real_jid(stanza.attr.from) then
                origin.send(st.error_reply(stanza, 'auth', 'forbidden'));
                return true;
            end
        end
        -- prosody will send item-not-found
    end, 1) -- make sure we handle it before prosody that uses priority -2 for this
end
