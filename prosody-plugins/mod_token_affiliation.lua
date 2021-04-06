-- ----------------------------------------------------------------------------
-- Token Affiliation
--
-- https://github.com/emrahcom/
-- ----------------------------------------------------------------------------
-- This plugin set the occupant's affiliation according to the token content.
--
-- 1) Copy this script to the Prosody plugins folder. It's the following folder
--    on Debian
--
--    /usr/share/jitsi-meet/prosody-plugins/
--
-- 2) Enable module in your prosody config.
--    /etc/prosody/conf.d/meet.mydomain.com.cfg.lua
--
--    Component "conference.meet.mydomain.com" "muc"
--       modules_enabled = {
--         "token_verification";
--         "token_affiliation";
--
-- 3) Disable auto-ownership on Jicofo and let the module set the affiliations
--    according to the token content. Add the following line to
--    /etc/jitsi/jicofo/sip-communicator.properties
--
--    org.jitsi.jicofo.DISABLE_AUTO_OWNER=true
--
-- 4) If exists, remove or comment org.jitsi.jicofo.auth.URL line in
--    /etc/jitsi/jicofo/sip-communicator.properties
--
--    #org.jitsi.jicofo.auth.URL=...
--
-- 5) Restart the services
--
--    systemctl restart prosody.service
--    systemctl restart jicofo.service
--
-- 6) Set the affiliation on token. The value may be "owner" or "member".
--
--    A sample token body:
--    {
--      "aud": "myapp",
--      "iss": "myapp",
--      "sub": "meet.mydomain.com",
--      "iat": 1601366000
--      "exp": 1601366180,
--      "room": "*",
--      "context": {
--        "user": {
--          "name": "myname",
--          "email": "myname@mydomain.com",
--          "affiliation": "owner"
--        }
--      }
--    }
-- ----------------------------------------------------------------------------
local LOGLEVEL = "debug"

local is_admin = require "core.usermanager".is_admin
local is_healthcheck_room = module:require "util".is_healthcheck_room
module:log(LOGLEVEL, "loaded")

local function _is_admin(jid)
    return is_admin(jid, module.host)
end

module:hook("muc-occupant-joined", function (event)
    local room, occupant = event.room, event.occupant

    if is_healthcheck_room(room.jid) or _is_admin(occupant.jid) then
        module:log(LOGLEVEL, "skip affiliation, %s", occupant.jid)
        return
    end

    if not event.origin.auth_token then
        module:log(LOGLEVEL, "skip affiliation, no token")
        return
    end

    local affiliation = "member"
    local context_user = event.origin.jitsi_meet_context_user

    if context_user then
        if context_user["affiliation"] == "owner" then
            affiliation = "owner"
        elseif context_user["affiliation"] == "moderator" then
            affiliation = "owner"
        elseif context_user["affiliation"] == "teacher" then
            affiliation = "owner"
        end
    end

    module:log(LOGLEVEL, "affiliation: %s", affiliation)
    room:set_affiliation(true, occupant.bare_jid, affiliation)
end)
