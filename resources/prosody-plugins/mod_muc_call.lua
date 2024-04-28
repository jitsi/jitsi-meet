local jid = require "util.jid"
local extract_subdomain = module:require "util".extract_subdomain;

-- Options and configuration
local poltergeist_component = module:get_option_string(
    "poltergeist_component",
    module.host
);
local muc_domain_base = module:get_option_string("muc_mapper_domain_base");
if not muc_domain_base then
    module:log(
        "warn",
        "No 'muc_domain_base' option set, unable to send call events."
    );
    return
end

-- Status strings that trigger call events.
local calling_status   = "calling"
local busy_status      = "busy"
local rejected_status  = "rejected"
local connected_status = "connected"
local expired_status   = "expired"

-- url_from_room_jid will determine the url for a conference
-- provided a room jid. It is required that muc domain mapping
-- is enabled and configured. There are two url formats that are supported.
-- The following urls are examples of the supported formats.
--     https://meet.jit.si/jitsi/ProductiveMeeting
--     https://meet.jit.si/MoreProductiveMeeting
-- The urls are derived from portions of the room jid.
local function url_from_room_jid(room_jid)
    local node, _, _ = jid.split(room_jid)
    if not node then return nil end

    local target_subdomain, target_node = extract_subdomain(node);

    if not(target_node or target_subdomain) then
        return "https://"..muc_domain_base.."/"..node
    else
        return "https://"..muc_domain_base.."/"..target_subdomain.."/"..target_node
    end
end

-- Listening for all muc presences stanza events. If a presence stanza is from
-- a poltergeist then it will be further processed to determine if a call
-- event should be triggered. Call events are triggered by status strings
-- the status strings supported are:
--    -------------------------
--    Status      | Event Type
--    _________________________
--    "calling"   | INVITE
--    "busy"      | CANCEL
--    "rejected"  | CANCEL
--    "connected" | CANCEL
module:hook(
    "muc-broadcast-presence",
    function (event)
        -- Detect if the presence is for a poltergeist or not.
	-- FIX ME: luacheck warning 581
	--   not (x == y)' can be replaced by 'x ~= y' (if neither side is a table or NaN)
        if not (jid.bare(event.occupant.jid) == poltergeist_component) then
            return
        end

        -- A presence stanza is needed in order to trigger any calls.
        if not event.stanza then
            return
        end

        local call_id = event.stanza:get_child_text("call_id")
        if not call_id then
            module:log("info", "A call id was not provided in the status.")
            return
        end

        local invite = function()
            local url = assert(url_from_room_jid(event.stanza.attr.from))
            module:fire_event('jitsi-call-invite', { stanza = event.stanza; url = url; call_id = call_id; });
        end

        local cancel = function()
            local url = assert(url_from_room_jid(event.stanza.attr.from))
            local status = event.stanza:get_child_text("status")
            module:fire_event('jitsi-call-cancel', {
                stanza = event.stanza;
                url = url;
                reason = string.lower(status);
                call_id = call_id;
            });
        end

        -- If for any reason call_cancel is set to true then a cancel
        -- is sent regardless of the rest of the presence info.
        local should_cancel = event.stanza:get_child_text("call_cancel")
        if should_cancel == "true" then
            cancel()
            return
        end

        local missed = function()
            cancel()
            module:fire_event('jitsi-call-missed', { stanza = event.stanza; call_id = call_id; });
        end

        -- All other call flow actions will require a status.
        if event.stanza:get_child_text("status") == nil then
            return
        end

        local switch = function(status)
            case = {
                [calling_status]   = function() invite() end,
                [busy_status]      = function() cancel() end,
                [rejected_status]  = function() missed() end,
                [expired_status]   = function() missed() end,
                [connected_status] = function() cancel() end
            }
            if case[status] then case[status]() end
        end

        switch(event.stanza:get_child_text("status"))
    end,
    -101
);
