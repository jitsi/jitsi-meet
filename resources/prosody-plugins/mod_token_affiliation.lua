-- mod_token_affiliation.lua
--
-- Grants owner affiliation (and thus moderator role) to MUC occupants whose
-- JWT contains moderator/affiliation claims, and member affiliation to all
-- other authenticated occupants.
--
-- JWT claims inspected (context.user.*):
--   affiliation == "owner" | "moderator" | "teacher"  →  owner
--   moderator   == true | "true"                       →  owner
--   Authenticated user with none of the above          →  member
--
-- The affiliation is written to the room's affiliation list inside
-- muc-occupant-pre-join (before the join completes), so the very first
-- presence broadcast already carries the correct affiliation and role.
-- No filtering or second hook required.
--
-- Originally imported from:
--   https://github.com/jitsi-contrib/prosody-plugins/tree/main/token_affiliation

local LOGLEVEL = module:get_option_string("token_affiliation_log_level", "debug")

local util = module:require 'util';
local is_admin = util.is_admin;
local is_healthcheck_room = util.is_healthcheck_room

module:log(LOGLEVEL, "loaded")

local function affiliation_from_token(session)
    if not session or not session.auth_token then
        return nil
    end

    local context_user = session.jitsi_meet_context_user
    if context_user then
        if context_user["affiliation"] == "owner"
            or context_user["affiliation"] == "moderator"
            or context_user["affiliation"] == "teacher"
            or context_user["moderator"] == "true"
            or context_user["moderator"] == true then
            return "owner"
        end
    end

    return "member"
end

module:hook("muc-occupant-pre-join", function(event)
    local room, occupant, session = event.room, event.occupant, event.origin

    if is_healthcheck_room(room.jid) or is_admin(occupant.bare_jid) then
        module:log(LOGLEVEL, "skip, %s", occupant.jid)
        return
    end

    local affiliation = affiliation_from_token(session)
    if not affiliation then
        return
    end

    room:set_affiliation(true, occupant.bare_jid, affiliation)
    if affiliation == "owner" then
        occupant.role = "moderator"
    end
    module:log(LOGLEVEL, "set affiliation=%s for %s", affiliation, occupant.bare_jid)
end)
