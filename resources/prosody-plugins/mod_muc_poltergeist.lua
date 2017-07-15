local bare = require "util.jid".bare;
local generate_uuid = require "util.uuid".generate;
local jid = require "util.jid";
local neturl = require "net.url";
local parse = neturl.parseQuery;
local st = require "util.stanza";
local get_room_from_jid = module:require "util".get_room_from_jid;

-- Options
local poltergeist_component
    = module:get_option_string("poltergeist_component", module.host);

-- table to store all poltergeists we create
local poltergeists = {};

-- poltergaist management functions

-- Returns the room if available, work and in multidomain mode
-- @param room_name the name of the room
-- @param group name of the group (optional)
-- @return returns room if found or nil
function get_room(room_name, group)
    local room_address = jid.join(room_name, module:get_host());
    -- if there is a group we are in multidomain mode
    if group and group ~= "" then
        room_address = "["..group.."]"..room_address;
    end

    return get_room_from_jid(room_address);
end

-- Stores the username in the table where we store poltergeist usernames
-- based on their room names
-- @param room the room instance
-- @param user_id the user id
-- @param username the username to store
function store_username(room, user_id, username)
    local room_name = jid.node(room.jid);

    -- we store in poltergeist user ids for room names
    if (not poltergeists[room_name]) then
        poltergeists[room_name] = {};
    end
    poltergeists[room_name][user_id] = username;
    log("debug", "stored in session: %s", username);
end

-- Retrieve the username for a user
-- @param room the room instance
-- @param user_id the user id
-- @return returns the stored username for user or nil
function get_username(room, user_id)
    local room_name = jid.node(room.jid);

    if (not poltergeists[room_name]) then
        return nil;
    end

    return poltergeists[room_name][user_id];
end

-- if we found that a session for a user with id has a poltergiest already
-- created, retrieve its jid and return it to the authentication
-- so we can reuse it and we that real user will replace the poltergiest
prosody.events.add_handler("pre-jitsi-authentication", function(session)

    if (session.jitsi_meet_context_user) then
        local room = get_room(
            session.jitsi_bosh_query_room,
            session.jitsi_meet_context_group);

        if (not room) then
            return nil;
        end

        local username
            = get_username(room, session.jitsi_meet_context_user["id"]);

        if (not username) then
            return nil;
        end

        log("debug", "Found predefined username %s", username);

        -- let's find the room and if the poltergeist occupant is there
        -- lets remove him before the real participant joins
        -- when we see the unavailable presence to go out the server
        -- we will mark it with ignore tag
        local nick = string.sub(username, 0, 8);
        if (have_poltergeist_occupant(room, nick)) then
            remove_poltergeist_occupant(room, nick);
        end

        return username;
    end

    return nil;
end);

-- Creates poltergeist occupant
-- @param room the room instance where we create the occupant
-- @param nick the nick to use for the new occupant
-- @param name the display name fot the occupant (optional)
-- @param avatar the avatar to use for the new occupant (optional)
function create_poltergeist_occupant(room, nick, name, avatar)
    log("debug", "create_poltergeist_occupant %s:", nick);
    -- Join poltergeist occupant to room, with the invited JID as their nick
    local join_presence = st.presence({
        to = room.jid.."/"..nick,
        from = poltergeist_component.."/"..nick
    }):tag("x", { xmlns = "http://jabber.org/protocol/muc" }):up();

    if (name) then
        join_presence:tag(
            "nick",
            { xmlns = "http://jabber.org/protocol/nick" }):text(name):up();
    end
    if (avatar) then
        join_presence:tag("avatar-url"):text(avatar):up();
    end

    room:handle_first_presence(
        prosody.hosts[poltergeist_component], join_presence);
end

-- Removes poltergeist occupant
-- @param room the room instance where to remove the occupant
-- @param nick the nick of the occupant to remove
function remove_poltergeist_occupant(room, nick)
    log("debug", "remove_poltergeist_occupant %s", nick);
    local leave_presence = st.presence({
        to = room.jid.."/"..nick,
        from = poltergeist_component.."/"..nick,
        type = "unavailable" });
    room:handle_normal_presence(
        prosody.hosts[poltergeist_component], leave_presence);
end

-- Checks for existance of a poltergeist occupant
-- @param room the room instance where to check for occupant
-- @param nick the nick of the occupant
-- @return true if occupant is found, false otherwise
function have_poltergeist_occupant(room, nick)
	-- Find out if we have a poltergeist occupant in the room for this JID
	return not not room:get_occupant_jid(poltergeist_component.."/"..nick);
end

-- Event handlers

--- Note: mod_muc and some of its sub-modules add event handlers between 0 and -100,
--- e.g. to check for banned users, etc.. Hence adding these handlers at priority -100.
module:hook("muc-decline", function (event)
	remove_poltergeist_occupant(event.room, bare(event.stanza.attr.from));
end, -100);
-- before sending the presence for a poltergeist leaving add ignore tag
-- as poltergeist is leaving just before the real user joins and in the client
-- we ignore this presence to avoid leaving/joining experience and the real
-- user will reuse all currently created UI components for the same nick
module:hook("muc-broadcast-presence", function (event)
    if (bare(event.occupant.jid) == poltergeist_component) then
        if(event.stanza.attr.type == "unavailable") then
            event.stanza:tag(
                "ignore", { xmlns = "http://jitsi.org/jitmeet/" }):up();
        end
    end
end, -100);

--- Handles request for creating/managing poltergeists
-- @param event the http event, holds the request query
-- @return GET response, containing a json with response details
function handle_create_poltergeist (event)
    local params = parse(event.request.url.query);
    local user_id = params["user"];
    local room_name = params["room"];
    local group = params["group"];
    local name = params["name"];
    local avatar = params["avatar"];

    local room = get_room(room_name, group);
    if (not room) then
        log("error", "no room found %s", room_address);
        return 404;
    end

    local username = generate_uuid();
    store_username(room, user_id, username)

    create_poltergeist_occupant(room, string.sub(username,0,8), name, avatar);

    return 200;
end

--- Handles request for updating poltergeists status
-- @param event the http event, holds the request query
-- @return GET response, containing a json with response details
function handle_update_poltergeist (event)
    local params = parse(event.request.url.query);
    local user_id = params["user"];
    local room_name = params["room"];
    local group = params["group"];
    local status = params["status"];

    local room = get_room(room_name, group);
    if (not room) then
        log("error", "no room found %s", room_address);
        return 404;
    end

    local username = get_username(room, user_id);
    if (not username) then
        return 404;
    end

    local nick = string.sub(username, 0, 8);
    if (have_poltergeist_occupant(room, nick)) then
        local update_presence = st.presence({
            to = room.jid.."/"..nick,
            from = poltergeist_component.."/"..nick
        }):tag("status"):text(status):up();

        room:handle_normal_presence(
            prosody.hosts[poltergeist_component], update_presence);

        return 200;
    else
        return 404;
    end
end


log("info", "Loading poltergeist service");
module:depends("http");
module:provides("http", {
    default_path = "/";
    name = "poltergeist";
    route = {
        ["GET /poltergeist/create"] = handle_create_poltergeist;
        ["GET /poltergeist/update"] = handle_update_poltergeist;
    };
});
