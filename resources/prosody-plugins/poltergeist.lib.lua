local inspect = require("inspect")
local jid = require("util.jid")
local stanza = require("util.stanza")
local timer = require("util.timer")
local update_presence_identity = module:require("util").update_presence_identity
local uuid = require("util.uuid")

local component = module:get_option_string(
    "poltergeist_component",
    module.host
)

local expiration_timeout = module:get_option_string(
    "poltergeist_leave_timeout",
    30 -- defaults to 30 seconds
)

local MUC_NS = "http://jabber.org/protocol/muc"

--------------------------------------------------------------------------------
-- Utility functions for commonly used poltergeist codes.
--------------------------------------------------------------------------------

-- Creates a nick for a poltergeist.
-- @param username is the unique username of the poltergeist
-- @return a nick to use for xmpp
local function create_nick(username)
    return string.sub(username, 0,8)
end

-- Returns the last presence of the occupant.
-- @param room the room instance where to check for occupant
-- @param nick the nick of the occupant
-- @return presence stanza of the occupant
function get_presence(room, nick)
    local occupant_jid = room:get_occupant_jid(component.."/"..nick)
    if occupant_jid then
        return room:get_occupant_by_nick(occupant_jid):get_presence();
    end
    return nil;
end

-- Checks for existence of a poltergeist occupant in a room.
-- @param room the room instance where to check for the occupant
-- @param nick the nick of the occupant
-- @return true if occupant is found, false otherwise
function occupies(room, nick)
    -- Find out if we have a poltergeist occupant in the room for this JID
    return not not room:get_occupant_jid(component.."/"..nick);
end

--------------------------------------------------------------------------------
-- Username storage for poltergeist.
--
-- Every poltergeist will have a username stored in a table underneath
-- the room name that they are currently active in. The username can
-- be retrieved given a room and a user_id. The username is removed from
-- a room by providing the room and the nick.
--
-- A table with a single entry looks like:
-- {
--   ["[hug]hostilewerewolvesthinkslightly"] = {
--     ["655363:52148a3e-b5fb-4cfc-8fbd-f55e793cf657"] = "ed7757d6-d88d-4e6a-8e24-aca2adc31348",
--     ed7757d6 = "655363:52148a3e-b5fb-4cfc-8fbd-f55e793cf657"
--   }
-- }
--------------------------------------------------------------------------------
-- state is the table where poltergeist usernames and call resources are stored
-- for a given xmpp muc.
local state = module:shared("state")

-- Adds a poltergeist to the store.
-- @param room is the room the poltergeist is being added to
-- @param user_id is the user_id of the user the poltergeist represents
-- @param username is the unique id of the poltergeist itself
local function store_username(room, user_id, username)
    local room_name = jid.node(room.jid)

    if not state[room_name] then
        state[room_name] = {}
    end

    state[room_name][user_id] = username
    state[room_name][create_nick(username)] = user_id
end

-- Retrieves a poltergeist username from the store if one exists.
-- @param room is the room to check for the poltergeist in the store
-- @param user_id is the user id of the user the poltergeist represents
local function get_username(room, user_id)
    local room_name = jid.node(room.jid)

    if not state[room_name] then
        return nil
    end

    return state[room_name][user_id]
end

local function get_username_from_nick(room_name, nick)
    if not state[room_name] then
        return nil
    end

    local user_id = state[room_name][nick]
    return state[room_name][user_id]
end

-- Removes the username from the store.
-- @param room is the room the poltergeist is being removed from
-- @param nick is the nick of the muc occupant
local function remove_username(room, nick)
    local room_name = jid.node(room.jid)
    if not state[room_name] then
        return
    end

    local user_id = state[room_name][nick]
    state[room_name][user_id] = nil
    state[room_name][nick] = nil
end

-- Removes all poltergeists in the store for the provided room.
-- @param room is the room all poltergiest will be removed from
local function remove_room(room)
    local room_name = jid.node(room.jid)
    if state[room_name] then
        state[room_name] = nil
    end
end

-- Adds a resource that is associated with a a call in a room. There
-- is only one resource for each type.
-- @param room is the room the call and poltergeist is in.
-- @param call_id is the unique id for the call.
-- @param resource_type is type of resource being added.
-- @param resource_id is the id of the resource being added.
local function add_call_resource(room, call_id, resource_type, resource_id)
    local room_name = jid.node(room.jid)
    if not state[room_name] then
        state[room_name] = {}
    end

    if not state[room_name][call_id] then
        state[room_name][call_id] = {}
    end

    state[room_name][call_id][resource_type] = resource_id
end

--------------------------------------------------------------------------------
-- State for toggling the tagging of presence stanzas with ignored tag.
--
-- A poltergeist with it's full room/nick set to ignore will have a jitsi ignore
-- tag applied to all presence stanza's broadcasted. The following functions
-- assist in managing this state.
--------------------------------------------------------------------------------
local presence_ignored = {}

-- Sets the nick to ignored state.
-- @param room_nick full room/nick jid
local function set_ignored(room_nick)
    presence_ignored[room_nick] = true
end

-- Resets the nick out of ignored state.
-- @param room_nick full room/nick jid
local function reset_ignored(room_nick)
    presence_ignored[room_nick] = nil
end

-- Determines whether or not the leave presence should be tagged with ignored.
-- @param room_nick full room/nick jid
local function should_ignore(room_nick)
    if presence_ignored[room_nick] == nil then
        return false
    end
    return presence_ignored[room_nick]
end

--------------------------------------------------------------------------------
-- Poltergeist control functions for adding, updating and removing poltergeist.
--------------------------------------------------------------------------------

-- Updates the status tags and call flow tags of an existing poltergeist
-- presence.
-- @param presence_stanza is the actual presence stanza for a poltergeist.
-- @param status is the new status to be updated in the stanza.
-- @param call_details is a table of call flow signal information.
function update_presence_tags(presence_stanza, status, call_details)
    local call_cancel = false
    local call_id = nil

    -- Extract optional call flow signal information.
    if call_details then
        call_id = call_details["id"]

        if call_details["cancel"] then
            call_cancel = call_details["cancel"]
        end
    end

    presence_stanza:maptags(function (tag)
        if tag.name == "status" then
            if call_cancel then
                -- If call cancel is set then the status should not be changed.
                return tag
            end
            return stanza.stanza("status"):text(status)
        elseif tag.name == "call_id" then
            if call_id then
                return stanza.stanza("call_id"):text(call_id)
            else
                -- If no call id is provided the re-use the existing id.
                return tag
            end
        elseif tag.name == "call_cancel" then
            if call_cancel then
                return stanza.stanza("call_cancel"):text("true")
            else
                return stanza.stanza("call_cancel"):text("false")
            end
        end
        return tag
    end)

    return presence_stanza
end

-- Updates the presence status of a poltergeist.
-- @param room is the room the poltergeist has occupied
-- @param nick is the xmpp nick of the poltergeist occupant
-- @param status is the status string to set in the presence
-- @param call_details is a table of call flow control details
local function update(room, nick, status, call_details)
    local original_presence = get_presence(room, nick)

    if not original_presence then
        module:log("info", "update issued for a non-existing poltergeist")
        return
    end

    -- update occupant presence with appropriate to and from
    -- so we can send it again
    update_presence = stanza.clone(original_presence)
    update_presence.attr.to = room.jid.."/"..nick
    update_presence.attr.from = component.."/"..nick

    update_presence = update_presence_tags(update_presence, status, call_details)

    module:log("info", "updating poltergeist: %s/%s - %s", room, nick, status)
    room:handle_normal_presence(
        prosody.hosts[component],
        update_presence
    )
end

-- Removes the poltergeist from the room.
-- @param room is the room the poltergeist has occupied
-- @param nick is the xmpp nick of the poltergeist occupant
-- @param ignore toggles if the leave subsequent leave presence should be tagged
local function remove(room, nick, ignore)
    local original_presence = get_presence(room, nick);
    if not original_presence then
        module:log("info", "attempted to remove a poltergeist with no presence")
        return
    end

    local leave_presence = stanza.clone(original_presence)
    leave_presence.attr.to = room.jid.."/"..nick
    leave_presence.attr.from = component.."/"..nick
    leave_presence.attr.type = "unavailable"

    if (ignore) then
        set_ignored(room.jid.."/"..nick)
    end

    remove_username(room, nick)
    module:log("info", "removing poltergeist: %s/%s", room, nick)
    room:handle_normal_presence(
        prosody.hosts[component],
        leave_presence
    )
end

-- Adds a poltergeist to a muc/room.
-- @param room is the room the poltergeist will occupy
-- @param is the id of the user the poltergeist represents
-- @param display_name is the display name to use for the poltergeist
-- @param avatar is the avatar link used for the poltergeist display
-- @param context is the session context of the user making the request
-- @param status is the presence status string to use
-- @param resources is a table of resource types and resource ids to correlate.
local function add_to_muc(room, user_id, display_name, avatar, context, status, resources)
    local username = uuid.generate()
    local presence_stanza = original_presence(
        room,
        username,
        display_name,
        avatar,
        context,
        status
    )

    module:log("info", "adding poltergeist: %s/%s", room, create_nick(username))
    store_username(room, user_id, username)
    for k, v in pairs(resources) do
        add_call_resource(room, username, k, v)
    end
    room:handle_first_presence(
        prosody.hosts[component],
        presence_stanza
    )

    local remove_delay = 5
    local expiration = expiration_timeout - remove_delay;
    local nick = create_nick(username)
    timer.add_task(
        expiration,
        function ()
            update(room, nick, "expired")
            timer.add_task(
                remove_delay,
                function ()
                    if occupies(room, nick) then
                        remove(room, nick, false)
                    end
                end
            )
        end
    )
end

-- Generates an original presence for a new poltergeist
-- @param room is the room the poltergeist will occupy
-- @param username is the unique name for the poltergeist
-- @param display_name is the display name to use for the poltergeist
-- @param avatar is the avatar link used for the poltergeist display
-- @param context is the session context of the user making the request
-- @param status is the presence status string to use
-- @return a presence stanza that can be used to add the poltergeist to the muc
function original_presence(room, username, display_name, avatar, context, status)
    local nick = create_nick(username)
    local p = stanza.presence({
        to = room.jid.."/"..nick,
        from = component.."/"..nick,
    }):tag("x", { xmlns = MUC_NS }):up();

    p:tag("bot", { type = "poltergeist" }):up();
    p:tag("call_cancel"):text(nil):up();
    p:tag("call_id"):text(username):up();

    if status then
        p:tag("status"):text(status):up();
    else
        p:tag("status"):text(nil):up();
    end

    if display_name then
        p:tag(
            "nick",
            { xmlns = "http://jabber.org/protocol/nick" }):text(display_name):up();
    end

    if avatar then
        p:tag("avatar-url"):text(avatar):up();
    end

    -- If the room has a password set, let the poltergeist enter using it
    local room_password = room:get_password();
    if room_password then
        local join = p:get_child("x", MUC_NS);
        join:tag("password", { xmlns = MUC_NS }):text(room_password);
    end

    update_presence_identity(
        p,
        context.user,
        context.group,
        context.creator_user,
        context.creator_group
    )
    return p
end

return {
    get_username = get_username,
    get_username_from_nick = get_username_from_nick,
    occupies = occupies,
    remove_room = remove_room,
    reset_ignored = reset_ignored,
    should_ignore = should_ignore,
    create_nick = create_nick,
    add_to_muc = add_to_muc,
    update = update,
    remove = remove
}
