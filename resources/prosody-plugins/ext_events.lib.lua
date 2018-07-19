-- invite will perform the trigger for external call invites.
-- This trigger is left unimplemented. The implementation is expected
-- to be specific to the deployment.
local function invite(stanza, url, call_id)
    module:log(
        "warn",
        "A module has been configured that triggers external events."
    )
    module:log("warn", "Implement this lib to trigger external events.")
end

-- cancel will perform the trigger for external call cancellation.
-- This trigger is left unimplemented. The implementation is expected
-- to be specific to the deployment.
local function cancel(stanza, url, reason, call_id)
    module:log(
        "warn",
        "A module has been configured that triggers external events."
    )
    module:log("warn", "Implement this lib to trigger external events.")
end

-- missed will perform the trigger for external call missed notification.
-- This trigger is left unimplemented. The implementation is expected
-- to be specific to the deployment.
local function missed(stanza, call_id)
    module:log(
        "warn",
        "A module has been configured that triggers external events."
    )
    module:log("warn", "Implement this lib to trigger external events.")
end


local ext_events = {
    missed = missed,
    invite = invite,
    cancel = cancel
}

return ext_events
