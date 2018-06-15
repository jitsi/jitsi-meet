local bare = require "util.jid".bare;
local generate_uuid = require "util.uuid".generate;
local jid = require "util.jid";
local neturl = require "net.url";
local parse = neturl.parseQuery;
local st = require "util.stanza";
local get_room_from_jid = module:require "util".get_room_from_jid;
local wrap_async_run = module:require "util".wrap_async_run;
local update_presence_identity = module:require "util".update_presence_identity;
local timer = require "util.timer";
local MUC_NS = "http://jabber.org/protocol/muc";
local expired_status  = "expired";

-- Options
local poltergeist_component
    = module:get_option_string("poltergeist_component", module.host);
-- defaults to 30 seconds
local poltergeist_timeout
    = module:get_option_string("poltergeist_leave_timeout", 30);
-- this basically strips the domain from the conference.domain address
local parentHostName = string.gmatch(tostring(module.host), "%w+.(%w.+)")();
if parentHostName == nil then
    log("error", "Failed to start - unable to get parent hostname");
    return;
end

local parentCtx = module:context(parentHostName);
if parentCtx == nil then
    log("error",
        "Failed to start - unable to get parent context for host: %s",
        tostring(parentHostName));
    return;
end
local token_util = module:require "token/util".new(parentCtx);

-- option to enable/disable token verifications
local disableTokenVerification
    = module:get_option_boolean("disable_polergeist_token_verification", false);

-- table to store all poltergeists we create
local poltergeists = {};
-- table to mark that outgoing unavailable presences
-- should be marked with ignore
local poltergeists_pr_ignore = {};

-- poltergaist management functions

-- Returns the room if available, work and in multidomain mode
-- @param room_name the name of the room
-- @param group name of the group (optional)
-- @return returns room if found or nil
function get_room(room_name, group)
    local room_address = jid.join(room_name, module:get_host());
    -- if there is a group we are in multidomain mode and that group is not
    -- our parent host
    if group and group ~= "" and group ~= parentHostName then
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

-- Removes poltergeist values from table
-- @param room the room instance
-- @param nick the user nick
function remove_username(room, nick)
    local room_name = jid.node(room.jid);
    if (poltergeists[room_name]) then
        local user_id_to_remove;
        for name,username in pairs(poltergeists[room_name]) do
            if (string.sub(username, 0, 8) == nick) then
                user_id_to_remove = name;
            end
        end
        if (user_id_to_remove) then
            poltergeists[room_name][user_id_to_remove] = nil;
        end
    end
end

--- Verifies room name, domain name with the values in the token
-- @param token the token we received
-- @param room_name the room name
-- @param group name of the group (optional)
-- @param session the session to use for storing token specific fields
-- @return true if values are ok or false otherwise
function verify_token(token, room_name, group, session)
    if disableTokenVerification then
        return true;
    end

    -- if not disableTokenVerification and we do not have token
    -- stop here, cause the main virtual host can have guest access enabled
    -- (allowEmptyToken = true) and we will allow access to rooms info without
    -- a token
    if token == nil then
        log("warn", "no token provided");
        return false;
    end

    session.auth_token = token;
    local verified, reason = token_util:process_and_verify_token(session);
    if not verified then
        log("warn", "not a valid token %s", tostring(reason));
        return false;
    end

    local room_address = jid.join(room_name, module:get_host());
    -- if there is a group we are in multidomain mode and that group is not
    -- our parent host
    if group and group ~= "" and group ~= parentHostName then
        room_address = "["..group.."]"..room_address;
    end

    if not token_util:verify_room(session, room_address) then
        log("warn", "Token %s not allowed to join: %s",
            tostring(token), tostring(room_address));
        return false;
    end

    return true;
end

-- if we found that a session for a user with id has a poltergiest already
-- created, retrieve its jid and return it to the authentication
-- so we can reuse it and we that real user will replace the poltergiest
prosody.events.add_handler("pre-jitsi-authentication", function(session)

    if (session.jitsi_meet_context_user) then
        local room = get_room(
            session.jitsi_bosh_query_room,
            session.jitsi_meet_domain);

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
            -- notify that user connected using the poltergeist
            update_poltergeist_occupant_status(
			   room, nick, "connected");
            remove_poltergeist_occupant(room, nick, true);
        end

        return username;
    end

    return nil;
end);

-- Removes poltergeist occupant
-- @param room the room instance where to remove the occupant
-- @param nick the nick of the occupant to remove
-- @param ignore to mark the poltergeist unavailble presence to be ignored
function remove_poltergeist_occupant(room, nick, ignore)
   log("debug", "remove_poltergeist_occupant %s", nick);

   local current_presence = get_presence(room, nick);
   if (not current_presence) then
      module:log("info", "attempted to remove a poltergeist with no presence")
      return;
   end

   local leave_presence = st.clone(current_presence)
   leave_presence.attr.to = room.jid.."/"..nick;
   leave_presence.attr.from = poltergeist_component.."/"..nick;
   leave_presence.attr.type = "unavailable";

   if (ignore) then
      poltergeists_pr_ignore[room.jid.."/"..nick] = true;
   end

   room:handle_normal_presence(
      prosody.hosts[poltergeist_component], leave_presence);
   remove_username(room, nick);
end

-- Updates poltergeist occupant status
-- @param room the room instance where to remove the occupant
-- @param nick the nick of the occupant to remove
-- @param status the status to update
-- @param call_details is a table of call flow details
function update_poltergeist_occupant_status(room, nick, status, call_details)
    local update_presence = get_presence(room, nick);

    if (not update_presence) then
       -- TODO: determine if we should provide an error and how that would be
       -- handled for bosh and http api.
       module:log("info", "update issued for a non-existing poltergeist")
       return;
    end

    -- update occupant presence with appropriate to and from
    -- so we can send it again
    update_presence = st.clone(update_presence);
    update_presence.attr.to = room.jid.."/"..nick;
    update_presence.attr.from = poltergeist_component.."/"..nick;

    update_presence = update_presence_tags(update_presence, status, call_details)

    room:handle_normal_presence(
        prosody.hosts[poltergeist_component], update_presence);
end

-- Updates the status tags and call flow tags of an existing poltergeist's
-- presence.
-- @param presence_stanza is the actual presence stanza for a poltergeist.
-- @param status is the new status to be updated in the stanza.
-- @param call_details is a table of call flow signal information.
function update_presence_tags(presence_stanza, status, call_details)
    local call_cancel = false;
    local call_id = nil;

    -- Extract optional call flow signal information.
    if call_details then
        call_id = call_details["id"];

        if call_details["cancel"] then
            call_cancel = call_details["cancel"];
        end
    end

    presence_stanza:maptags(function (tag)
        if tag.name == "status" then
            if call_cancel then
                -- If call cancel is set then the status should not be changed.
                return tag
            end
            return st.stanza("status"):text(status);
        elseif tag.name == "call_id" then
            if call_id then
                return st.stanza("call_id"):text(call_id);
            else
                -- If no call id is provided the re-use the existing id.
                return tag;
            end
        elseif tag.name == "call_cancel" then
            if call_cancel then
                return st.stanza("call_cancel"):text("true");
            else
                return st.stanza("call_cancel"):text("false");
            end
        end
        return tag;
    end);

    return presence_stanza
end

-- Checks for existance of a poltergeist occupant
-- @param room the room instance where to check for occupant
-- @param nick the nick of the occupant
-- @return true if occupant is found, false otherwise
function have_poltergeist_occupant(room, nick)
	-- Find out if we have a poltergeist occupant in the room for this JID
	return not not room:get_occupant_jid(poltergeist_component.."/"..nick);
end

-- Returns the last presence of occupant
-- @param room the room instance where to check for occupant
-- @param nick the nick of the occupant
-- @return presence of the occupant
function get_presence(room, nick)
    local occupant_jid
        = room:get_occupant_jid(poltergeist_component.."/"..nick);
    if (occupant_jid) then
        return room:get_occupant_by_nick(occupant_jid):get_presence();
    end

    return nil;
end

-- Event handlers

--- Note: mod_muc and some of its sub-modules add event handlers between 0 and -100,
--- e.g. to check for banned users, etc.. Hence adding these handlers at priority -100.
module:hook("muc-decline", function (event)
	remove_poltergeist_occupant(event.room, bare(event.stanza.attr.from), false);
end, -100);
-- before sending the presence for a poltergeist leaving add ignore tag
-- as poltergeist is leaving just before the real user joins and in the client
-- we ignore this presence to avoid leaving/joining experience and the real
-- user will reuse all currently created UI components for the same nick
module:hook("muc-broadcast-presence", function (event)
    if (bare(event.occupant.jid) == poltergeist_component) then
        if(event.stanza.attr.type == "unavailable"
            and poltergeists_pr_ignore[event.occupant.nick]) then
            event.stanza:tag(
                "ignore", { xmlns = "http://jitsi.org/jitmeet/" }):up();
            poltergeists_pr_ignore[event.occupant.nick] = nil;
        end
    end
end, -100);

-- cleanup room table after room is destroyed
module:hook("muc-room-destroyed",function(event)
    local room_name = jid.node(event.room.jid);
    if (poltergeists[room_name]) then
        poltergeists[room_name] = nil;
    end
end);

--- Handles request for creating/managing poltergeists
-- @param event the http event, holds the request query
-- @return GET response, containing a json with response details
function handle_create_poltergeist (event)
    if (not event.request.url.query) then
        return 400;
    end

    local params = parse(event.request.url.query);
    local user_id = params["user"];
    local room_name = params["room"];
    local group = params["group"];
    local name = params["name"];
    local avatar = params["avatar"];
    local status = params["status"];
    local session = {};

    if not verify_token(params["token"], room_name, group, session) then
        return 403;
    end

    -- If the provided room conference doesn't exist then we
    -- can't add a poltergeist to it.
    local room = get_room(room_name, group);
    if (not room) then
        log("error", "no room found %s", room_name);
        return 404;
    end

    -- If the poltergiest is already in the conference then it will
    -- be in our username store and another can't be added.
    local username = get_username(room, user_id);
    if (username ~= nil
        and have_poltergeist_occupant(room, string.sub(username, 0, 8))) then
        log("warn", "poltergeist for username:%s already in the room:%s",
            username, room_name);
        return 202;
    end
    username = generate_uuid();
    local context = {
       user = {
	  id = user_id;
       };
       group = group;
       creator_user = session.jitsi_meet_context_user;
       creator_group = session.jitsi_meet_context_group;
    };

    local nick = string.sub(username, 0, 8)
    local presence_stanza = original_presence(
       poltergeist_component,
       room,
       nick,
       name,
       avatar,
       username,
       context,
       status
    )
    store_username(room, user_id, username);

    room:handle_first_presence(
       prosody.hosts[poltergeist_component],
       presence_stanza
    );

    -- the timeout before removing so participants can see the status update
    local removeTimeout = 5;
    local timeout = poltergeist_timeout - removeTimeout;

    timer.add_task(timeout,
        function ()
            update_poltergeist_occupant_status(
                room, nick, expired_status);
            -- and remove it after some time so participant can see
            -- the update
            timer.add_task(removeTimeout,
                function ()
                    if (have_poltergeist_occupant(room, nick)) then
                        remove_poltergeist_occupant(room, nick, false);
                    end
                end);
        end);

    return 200;
end

-- Generate the original presence for a poltergeist when it is added to a room.
-- @param component is the configured component name for poltergeist.
-- @param room is the room the poltergeist is being added to.
-- @param nick is the nick the poltergeist will use for xmpp.
-- @param avatar is the url of the display avatar for the poltergeist.
-- @param username is the poltergeist unique username.
-- @param context is the context information from the valid auth token.
-- @param status is the status string for the presence.
-- @return a presence stanza
function original_presence(
	component, room, nick, name, avatar, username, context, status)
    local p = st.presence({
	    to = room.jid.."/"..nick,
	    from = component.."/"..nick,
   }):tag("x", { xmlns = MUC_NS }):up();

    p:tag("call_cancel"):text(nil):up();
    p:tag("call_id"):text(username):up();

   if status then
       p:tag("status"):text(status):up();
   else
       p:tag("status"):text(nil):up();
   end

   if (name) then
       p:tag(
	   "nick",
	   { xmlns = "http://jabber.org/protocol/nick" }):text(name):up();
   end

   if (avatar) then
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
   );
   return p
end

--- Handles request for updating poltergeists status
-- @param event the http event, holds the request query
-- @return GET response, containing a json with response details
function handle_update_poltergeist (event)
    if (not event.request.url.query) then
        return 400;
    end

    local params = parse(event.request.url.query);
    local user_id = params["user"];
    local room_name = params["room"];
    local group = params["group"];
    local status = params["status"];
    local call_id = params["callid"];

    local call_cancel = false
    if params["callcancel"] == "true" then
       call_cancel = true;
    end

    if not verify_token(params["token"], room_name, group, {}) then
        return 403;
    end

    local room = get_room(room_name, group);
    if (not room) then
        log("error", "no room found %s", room_name);
        return 404;
    end

    local username = get_username(room, user_id);
    if (not username) then
        return 404;
    end

	local call_details = {
	   ["cancel"] = call_cancel;
	   ["id"] = call_id;
	};

    local nick = string.sub(username, 0, 8);
    if (not have_poltergeist_occupant(room, nick)) then
       return 404;
    end

    update_poltergeist_occupant_status(room, nick, status, call_details);
    return 200;
end

--- Handles remove poltergeists
-- @param event the http event, holds the request query
-- @return GET response, containing a json with response details
function handle_remove_poltergeist (event)
    if (not event.request.url.query) then
        return 400;
    end

    local params = parse(event.request.url.query);
    local user_id = params["user"];
    local room_name = params["room"];
    local group = params["group"];

    if not verify_token(params["token"], room_name, group, {}) then
        return 403;
    end

    local room = get_room(room_name, group);
    if (not room) then
        log("error", "no room found %s", room_name);
        return 404;
    end

    local username = get_username(room, user_id);
    if (not username) then
        return 404;
    end

    local nick = string.sub(username, 0, 8);
    if (not have_poltergeist_occupant(room, nick)) then
       return 404;
    end

    remove_poltergeist_occupant(room, nick, false);
    return 200;
end

log("info", "Loading poltergeist service");
module:depends("http");
module:provides("http", {
    default_path = "/";
    name = "poltergeist";
    route = {
        ["GET /poltergeist/create"] = function (event) return wrap_async_run(event,handle_create_poltergeist) end;
        ["GET /poltergeist/update"] = function (event) return wrap_async_run(event,handle_update_poltergeist) end;
        ["GET /poltergeist/remove"] = function (event) return wrap_async_run(event,handle_remove_poltergeist) end;
    };
});
