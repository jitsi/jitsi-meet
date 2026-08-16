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

-- Hook priority -3.5: runs after lobby-bypass plugins such as mod_token_lobby_bypass
-- (priority -3), so any affiliation they grant is visible here and can be upgraded
-- to the correct token-derived value.  Runs before the lobby gate (-4) and
-- Prosody's built-in members_only check (-5).
module:hook("muc-occupant-pre-join", function(event)
    local room, occupant, session = event.room, event.occupant, event.origin

    if is_healthcheck_room(room.jid) or is_admin(occupant.bare_jid) then
        module:log(LOGLEVEL, "skip, %s", occupant.jid)
        return
    end

    -- When lobby is active (members-only) only proceed when the user already
    -- has a non-none affiliation (admitted by moderator, or granted by a bypass
    -- plugin that ran at priority -3) or is bypassing via the room password.
    -- Otherwise let the lobby gate (-4) block this first join attempt.
    if room:get_members_only() then
        local existing = room:get_affiliation(occupant.bare_jid)
        if not existing or existing == 'none' then
            local join_el = event.stanza:get_child('x', 'http://jabber.org/protocol/muc')
            local join_pwd = join_el and join_el:get_child_text('password', 'http://jabber.org/protocol/muc')
            local bypassing_via_password = join_pwd and room:get_password() and join_pwd == room:get_password()
            if not bypassing_via_password then
                module:log(LOGLEVEL, "skip, lobby active for %s", occupant.bare_jid)
                return
            end
        end
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
end, -3.5)
