-- ----------------------------------------------------------------------------
-- Token Owner Party
--
-- https://github.com/emrahcom/
-- ----------------------------------------------------------------------------
-- This plugin prevents the unauthorized users to create a room and terminates
-- the conference when the owner leaves. It's designed to run with
-- token_verification and token_affiliation plugins.
--
-- 1) Copy this script to the Prosody plugins folder. It's the following folder
--    on Debian
--
--    /usr/share/jitsi-meet/prosody-plugins/
--
-- 2) Enable module in your prosody config. If you want change the timeout sec.
--    /etc/prosody/conf.d/meet.mydomain.com.cfg.lua
--
--    Component "conference.meet.mydomain.com" "muc"
--       modules_enabled = {
--         ...
--         ...
--         "token_verification";
--         "token_affiliation";
--         "token_owner_party";
--       }
--       party_check_timeout = 20
--
-- 3) For most scenarios you may want to disable auto-ownership on Jicofo.
--    Add the following line to /etc/jitsi/jicofo/sip-communicator.properties
--
--    org.jitsi.jicofo.DISABLE_AUTO_OWNER=true
--
-- 4) Restart the services
--
--    systemctl restart prosody.service
--    systemctl restart jicofo.service
-- ----------------------------------------------------------------------------
local LOGLEVEL = "debug"
local TIMEOUT = module:get_option_number("party_check_timeout", 60)

local is_admin = require "core.usermanager".is_admin
local is_healthcheck_room = module:require "util".is_healthcheck_room
local it = require "util.iterators"
local st = require "util.stanza"
local timer = require "util.timer"
module:log(LOGLEVEL, "loaded")

local function _is_admin(jid)
    return is_admin(jid, module.host)
end

module:hook("muc-occupant-pre-join", function (event)
    local room, stanza = event.room, event.stanza
    local user_jid = stanza.attr.from

    if is_healthcheck_room(room.jid) or _is_admin(user_jid) then
        module:log(LOGLEVEL, "location check, %s", user_jid)
        return
    end

    -- if an owner joins, start the party
    local context_user = event.origin.jitsi_meet_context_user
    if context_user then
        if context_user["affiliation"] == "owner" or
           context_user["affiliation"] == "moderator" or
           context_user["affiliation"] == "teacher" then
            module:log(LOGLEVEL, "let the party begin")
            return
        end
    end

    -- if the party has not started yet, don't accept the participant
    local occupant_count = it.count(room:each_occupant())
    if occupant_count < 2 then
        module:log(LOGLEVEL, "the party has not started yet")
        event.origin.send(st.error_reply(stanza, 'cancel', 'not-allowed'))
        return true
    end
end)

module:hook("muc-occupant-left", function (event)
    local room, occupant = event.room, event.occupant

    if is_healthcheck_room(room.jid) or _is_admin(occupant.jid) then
        return
    end

    -- no need to do anything for normal participant
    if room:get_affiliation(occupant.jid) ~= "owner" then
        module:log(LOGLEVEL, "a participant leaved, %s", occupant.jid)
        return
    end

    -- the owner is gone, start to check the room condition
    room:broadcast_message(
        st.message({ type="groupchat", from=occupant.nick })
        :tag("body"):text("The owner is gone"))
    module:log(LOGLEVEL, "an owner leaved, %s", occupant.jid)

    -- check if there is any other owner here
    for _, o in room:each_occupant() do
        if not _is_admin(o.jid) then
            if room:get_affiliation(o.jid) == "owner" then
                module:log(LOGLEVEL, "an owner is here, %s", o.jid)
                return
            end
        end
    end

    -- since there is no other owner, kick all participants after TIMEOUT secs
    timer.add_task(TIMEOUT, function()
        if is_healthcheck_room(room.jid) then
            return
        end

        -- last check before kicking all participants
        -- if the owner is returned, cancel
        for _, o in room:each_occupant() do
            if not _is_admin(o.jid) then
                if room:get_affiliation(o.jid) == "owner" then
                    module:log(LOGLEVEL, "timer, an owner is here, %s", o.jid)
                    return
                end
            end
        end

        -- kick all participants
        for _, p in room:each_occupant() do
            if not _is_admin(p.jid) then
                if room:get_affiliation(p.jid) ~= "owner" then
                    room:set_affiliation(true, p.jid, "outcast")
                    module:log(LOGLEVEL, "timer, kick the occupant, %s", p.jid)
                end
            end
        end

        module:log(LOGLEVEL, "the party finished")
    end)
end)
