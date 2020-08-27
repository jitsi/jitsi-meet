local bare = require "util.jid".bare;
local get_room_from_jid = module:require "util".get_room_from_jid;
local jid = require "util.jid";
local neturl = require "net.url";
local parse = neturl.parseQuery;
local poltergeist = module:require "poltergeist";

local have_async = pcall(require, "util.async");
if not have_async then
    module:log("error", "requires a version of Prosody with util.async");
    return;
end

local async_handler_wrapper = module:require "util".async_handler_wrapper;

-- Options
local poltergeist_component
    = module:get_option_string("poltergeist_component", module.host);

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

-- Event handlers

-- if we found that a session for a user with id has a poltergiest already
-- created, retrieve its jid and return it to the authentication
-- so we can reuse it and we that real user will replace the poltergiest
prosody.events.add_handler("pre-jitsi-authentication", function(session)

    if (session.jitsi_meet_context_user) then
        local room = get_room(
            session.jitsi_web_query_room,
            session.jitsi_web_query_prefix);

        if (not room) then
            return nil;
        end

        local username = poltergeist.get_username(
           room,
           session.jitsi_meet_context_user["id"]
        );

        if (not username) then
            return nil;
        end

        log("debug", "Found predefined username %s", username);

        -- let's find the room and if the poltergeist occupant is there
        -- lets remove him before the real participant joins
        -- when we see the unavailable presence to go out the server
        -- we will mark it with ignore tag
        local nick = poltergeist.create_nick(username);
        if (poltergeist.occupies(room, nick)) then
            module:log("info", "swapping poltergeist for user: %s/%s", room, nick)
            -- notify that user connected using the poltergeist
            poltergeist.update(room, nick, "connected");
            poltergeist.remove(room, nick, true);
        end

        return username;
    end

    return nil;
end);

--- Note: mod_muc and some of its sub-modules add event handlers between 0 and -100,
--- e.g. to check for banned users, etc.. Hence adding these handlers at priority -100.
module:hook("muc-decline", function (event)
    poltergeist.remove(event.room, bare(event.stanza.attr.from), false);
end, -100);
-- before sending the presence for a poltergeist leaving add ignore tag
-- as poltergeist is leaving just before the real user joins and in the client
-- we ignore this presence to avoid leaving/joining experience and the real
-- user will reuse all currently created UI components for the same nick
module:hook("muc-broadcast-presence", function (event)
    if (bare(event.occupant.jid) == poltergeist_component) then
        if(event.stanza.attr.type == "unavailable"
        and poltergeist.should_ignore(event.occupant.nick)) then
            event.stanza:tag(
                "ignore", { xmlns = "http://jitsi.org/jitmeet/" }):up();
                poltergeist.reset_ignored(event.occupant.nick);
        end
    end
end, -100);

-- cleanup room table after room is destroyed
module:hook(
   "muc-room-destroyed",
   function(event)
      poltergeist.remove_room(event.room);
   end
);

--- Handles request for creating/managing poltergeists
-- @param event the http event, holds the request query
-- @return GET response, containing a json with response details
function handle_create_poltergeist (event)
    if (not event.request.url.query) then
        return { status_code = 400; };
    end

    local params = parse(event.request.url.query);
    local user_id = params["user"];
    local room_name = params["room"];
    local group = params["group"];
    local name = params["name"];
    local avatar = params["avatar"];
    local status = params["status"];
    local conversation = params["conversation"];
    local session = {};

    if not verify_token(params["token"], room_name, group, session) then
        return { status_code = 403; };
    end

    -- If the provided room conference doesn't exist then we
    -- can't add a poltergeist to it.
    local room = get_room(room_name, group);
    if (not room) then
        log("error", "no room found %s", room_name);
        return { status_code = 404; };
    end

    -- If the poltergiest is already in the conference then it will
    -- be in our username store and another can't be added.
    local username = poltergeist.get_username(room, user_id);
    if (username ~=nil and
        poltergeist.occupies(room, poltergeist.create_nick(username))) then
        log("warn",
            "poltergeist for username:%s already in the room:%s",
            username,
            room_name
        );
        return { status_code = 202; };
    end

    local context = {
       user = {
           id = user_id;
       };
       group = group;
       creator_user = session.jitsi_meet_context_user;
       creator_group = session.jitsi_meet_context_group;
    };
    if avatar ~= nil then
        context.user.avatar = avatar
    end
    local resources = {};
    if conversation ~= nil then
        resources["conversation"] = conversation
    end

    poltergeist.add_to_muc(room, user_id, name, avatar, context, status, resources)
    return { status_code = 200; };
end

--- Handles request for updating poltergeists status
-- @param event the http event, holds the request query
-- @return GET response, containing a json with response details
function handle_update_poltergeist (event)
    if (not event.request.url.query) then
        return { status_code = 400; };
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
        return { status_code = 403; };
    end

    local room = get_room(room_name, group);
    if (not room) then
        log("error", "no room found %s", room_name);
        return { status_code = 404; };
    end

    local username = poltergeist.get_username(room, user_id);
    if (not username) then
        return { status_code = 404; };
    end

    local call_details = {
        ["cancel"] = call_cancel;
        ["id"] = call_id;
    };

    local nick = poltergeist.create_nick(username);
    if (not poltergeist.occupies(room, nick)) then
       return { status_code = 404; };
    end

    poltergeist.update(room, nick, status, call_details);
    return { status_code = 200; };
end

--- Handles remove poltergeists
-- @param event the http event, holds the request query
-- @return GET response, containing a json with response details
function handle_remove_poltergeist (event)
    if (not event.request.url.query) then
        return { status_code = 400; };
    end

    local params = parse(event.request.url.query);
    local user_id = params["user"];
    local room_name = params["room"];
    local group = params["group"];

    if not verify_token(params["token"], room_name, group, {}) then
        return { status_code = 403; };
    end

    local room = get_room(room_name, group);
    if (not room) then
        log("error", "no room found %s", room_name);
        return { status_code = 404; };
    end

    local username = poltergeist.get_username(room, user_id);
    if (not username) then
        return { status_code = 404; };
    end

    local nick = poltergeist.create_nick(username);
    if (not poltergeist.occupies(room, nick)) then
       return { status_code = 404; };
    end

    poltergeist.remove(room, nick, false);
    return { status_code = 200; };
end

log("info", "Loading poltergeist service");
module:depends("http");
module:provides("http", {
    default_path = "/";
    name = "poltergeist";
    route = {
        ["GET /poltergeist/create"] = function (event) return async_handler_wrapper(event,handle_create_poltergeist) end;
        ["GET /poltergeist/update"] = function (event) return async_handler_wrapper(event,handle_update_poltergeist) end;
        ["GET /poltergeist/remove"] = function (event) return async_handler_wrapper(event,handle_remove_poltergeist) end;
    };
});
