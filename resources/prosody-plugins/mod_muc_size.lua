-- Prosody IM
-- Copyright (C) 2017 Atlassian
--
-- This project is MIT/X11 licensed. Please see the
-- COPYING file in the source package for more information.
--
-- This module requires net-url module
-- Install it using #luarocks install net-url

module:set_global(); -- Global module

local split_jid = require "util.jid".split;
local st = require "util.stanza";
local it = require "util.iterators";
local json = require "util.json";
local iterators = require "util.iterators";
local array = require"util.array";

local tostring = tostring;
local neturl = require "net.url";
local parse = neturl.parseQuery;

function get_room_from_jid(jid)
	local node, host = split_jid(jid);
	local component = hosts[host];
	if component then
		local muc = component.modules.muc
		if muc and rawget(muc,"rooms") then
			-- We're running 0.9.x or 0.10 (old MUC API)
			return muc.rooms[jid];
		elseif muc and rawget(muc,"get_room_from_jid") then
			-- We're running >0.10 (new MUC API)
			return muc.get_room_from_jid(jid);
		else
			return
		end
	end
end

function handle_get_room_size(event)
	local params = parse(event.request.url.query);
	local room_name = params["room"];
	local domain_name = params["domain"];
	local room_address = room_name .. "@" .. "conference." .. domain_name;
	local room = get_room_from_jid(room_address);
	local participant_count = 0;

	log("debug", "Querying room %s", tostring(room_address));

	if room then
		local occupants = room._occupants;
		if occupants then
			participant_count = iterators.count(room:each_occupant());
		end
		log("debug", "there are %s occupants in room", tostring(participant_count));
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

function handle_get_room (event)
	local params = parse(event.request.url.query);
	local room_name = params["room"];
	local domain_name = params["domain"];
	local room_address = room_name .. "@" .. "conference." .. domain_name;
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
		log("debug", "there are %s occupants in room", tostring(participant_count));
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

function module.add_host(module)
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

