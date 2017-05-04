-- Prosody IM
-- Copyright (C) 2017 Atlassian
--
-- This module requires net-url module
-- Install it using #luarocks install net-url

local jid = require "util.jid";
local it = require "util.iterators";
local json = require "util.json";
local iterators = require "util.iterators";
local array = require"util.array";

local tostring = tostring;
local neturl = require "net.url";
local parse = neturl.parseQuery;

-- option to enable/disable room API token verifications
local enableTokenVerification
    = module:get_option_boolean("enable_roomsize_token_verification", false);

local token_util = module:require "token/util".new(module);

-- no token configuration but required
if token_util == nil and enableTokenVerification then
    log("error", "no token configuration but it is required");
    return;
end

-- required parameter for custom muc component prefix,
-- defaults to "conference"
local muc_domain_prefix
    = module:get_option_string("muc_mapper_domain_prefix", "conference");

--- Finds and returns room by its jid
-- @param room_jid the room jid to search in the muc component
-- @return returns room if found or nil
function get_room_from_jid(room_jid)
	local _, host = jid.split(room_jid);
	local component = hosts[host];
	if component then
		local muc = component.modules.muc
		if muc and rawget(muc,"rooms") then
			-- We're running 0.9.x or 0.10 (old MUC API)
			return muc.rooms[room_jid];
		elseif muc and rawget(muc,"get_room_from_jid") then
			-- We're running >0.10 (new MUC API)
			return muc.get_room_from_jid(room_jid);
		else
			return
		end
	end
end

--- Verifies room name, domain name with the values in the token
-- @param token the token we received
-- @param room_address the full room address jid
-- @return true if values are ok or false otherwise
function verify_token(token, room_address)
    if not enableTokenVerification then
        return true;
    end

    -- if enableTokenVerification is enabled and we do not have token
    -- stop here, cause the main virtual host can have guest access enabled
    -- (allowEmptyToken = true) and we will allow access to rooms info without
    -- a token
    if token == nil then
        log("warn", "no token provided");
        return false;
    end

    local session = {};
    session.auth_token = token;
    local verified, reason = token_util:process_and_verify_token(session);
    if not verified then
        log("warn", "not a valid token %s", tostring(reason));
        return false;
    end

    if not token_util:verify_room(session, room_address) then
        log("warn", "Token %s not allowed to join: %s",
            tostring(token), tostring(room_address));
        return false;
    end

    return true;
end

--- Handles request for retrieving the room size
-- @param event the http event, holds the request query
-- @return GET response, containing a json with participants count,
--         tha value is without counting the focus.
function handle_get_room_size(event)
	local params = parse(event.request.url.query);
	local room_name = params["room"];
	local domain_name = params["domain"];
    local subdomain = params["subdomain"];

    local room_address
        = jid.join(room_name, muc_domain_prefix.."."..domain_name);

    if subdomain and subdomain ~= "" then
        room_address = "["..subdomain.."]"..room_address;
    end

    if not verify_token(params["token"], room_address) then
        return 403;
    end

	local room = get_room_from_jid(room_address);
	local participant_count = 0;

	log("debug", "Querying room %s", tostring(room_address));

	if room then
		local occupants = room._occupants;
		if occupants then
			participant_count = iterators.count(room:each_occupant());
		end
		log("debug",
            "there are %s occupants in room", tostring(participant_count));
	else
		log("debug", "no such room exists");
	end

	if participant_count > 1 then
		participant_count = participant_count - 1;
	end

	local GET_response = {
		headers = {
			content_type = "application/json";
		};
		body = [[{"participants":]]..participant_count..[[}]];
	};
	return GET_response;
end

--- Handles request for retrieving the room participants details
-- @param event the http event, holds the request query
-- @return GET response, containing a json with participants details
function handle_get_room (event)
	local params = parse(event.request.url.query);
	local room_name = params["room"];
	local domain_name = params["domain"];
    local subdomain = params["subdomain"];
    local room_address
        = jid.join(room_name, muc_domain_prefix.."."..domain_name);

    if subdomain ~= "" then
        room_address = "["..subdomain.."]"..room_address;
    end

    if not verify_token(params["token"], room_address) then
        return 403;
    end

	local room = get_room_from_jid(room_address);
	local participant_count = 0;
	local occupants_json = array();

	log("debug", "Querying room %s", tostring(room_address));

	if room then
		local occupants = room._occupants;
		if occupants then
			participant_count = iterators.count(room:each_occupant());
			for _, occupant in room:each_occupant() do
			    -- filter focus as we keep it as hidden participant
			    if string.sub(occupant.nick,-string.len("/focus"))~="/focus" then
				    for _, pr in occupant:each_session() do
					local nick = pr:get_child_text("nick", "http://jabber.org/protocol/nick") or "";
					local email = pr:get_child_text("email") or "";
					occupants_json:push({
					    jid = tostring(occupant.nick),
					    email = tostring(email),
					    display_name = tostring(nick)});
				    end
			    end
			end
		end
		log("debug",
            "there are %s occupants in room", tostring(participant_count));
	else
		log("debug", "no such room exists");
	end

	if participant_count > 1 then
		participant_count = participant_count - 1;
	end

	local GET_response = {
		headers = {
			content_type = "application/json";
		};
		body = json.encode(occupants_json);
	};
	return GET_response;
end;

function module.load()
    module:depends("http");
	module:provides("http", {
		default_path = "/";
		route = {
			["GET room-size"] = handle_get_room_size;
			["GET sessions"] = function () return tostring(it.count(it.keys(prosody.full_sessions))); end;
			["GET room"] = handle_get_room;
		};
	});
end

