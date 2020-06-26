-- Prosody IM
-- Copyright (C) 2008-2010 Matthew Wild
-- Copyright (C) 2008-2010 Waqas Hussain
-- Copyright (C) 2014 Daurnimator
--
-- This project is MIT/X11 licensed. Please see the
-- COPYING file in the source package for more information.
--

local select = select;
local pairs = pairs;
local next = next;
local setmetatable = setmetatable;

local dataform = require "util.dataforms";
local iterators = require "util.iterators";
local jid_split = require "util.jid".split;
local jid_bare = require "util.jid".bare;
local jid_prep = require "util.jid".prep;
local jid_join = require "util.jid".join;
local jid_resource = require "util.jid".resource;
local resourceprep = require "util.encodings".stringprep.resourceprep;
local st = require "util.stanza";
local base64 = require "util.encodings".base64;
local md5 = require "util.hashes".md5;

local log = module._log;

local occupant_lib = module:require "muc/occupant"
local muc_util = module:require "muc/util";
local is_kickable_error = muc_util.is_kickable_error;
local valid_roles, valid_affiliations = muc_util.valid_roles, muc_util.valid_affiliations;

local room_mt = {};
room_mt.__index = room_mt;

function room_mt:__tostring()
	return "MUC room ("..self.jid..")";
end

function room_mt.save()
	-- overriden by mod_muc.lua
end

function room_mt:get_occupant_jid(real_jid)
	return self._jid_nick[real_jid]
end

function room_mt:get_default_role(affiliation)
	local role = module:fire_event("muc-get-default-role", {
		room = self;
		affiliation = affiliation;
		affiliation_rank = valid_affiliations[affiliation or "none"];
	});
	role = role ~= "none" and role or nil; -- coerces `role == false` to `nil`
	return role, valid_roles[role or "none"];
end
module:hook("muc-get-default-role", function(event)
	if event.affiliation_rank >= valid_affiliations.admin then
		return "moderator";
	elseif event.affiliation_rank >= valid_affiliations.none then
		return "participant";
	end
end, -1);

--- Occupant functions
function room_mt:new_occupant(bare_real_jid, nick)
	local occupant = occupant_lib.new(bare_real_jid, nick);
	local affiliation = self:get_affiliation(bare_real_jid);
	occupant.role = self:get_default_role(affiliation);
	return occupant;
end

-- nick is in the form of an in-room JID
function room_mt:get_occupant_by_nick(nick)
	local occupant = self._occupants[nick];
	if occupant == nil then return nil end
	return occupant_lib.copy(occupant);
end

do
	local function next_copied_occupant(occupants, occupant_jid)
		local next_occupant_jid, raw_occupant = next(occupants, occupant_jid);
		if next_occupant_jid == nil then return nil end
		return next_occupant_jid, occupant_lib.copy(raw_occupant);
	end
	-- FIXME Explain what 'read_only' is supposed to be
	function room_mt:each_occupant(read_only) -- luacheck: ignore 212
		return next_copied_occupant, self._occupants, nil;
	end
end

function room_mt:has_occupant()
	return next(self._occupants, nil) ~= nil
end

function room_mt:get_occupant_by_real_jid(real_jid)
	local occupant_jid = self:get_occupant_jid(real_jid);
	if occupant_jid == nil then return nil end
	return self:get_occupant_by_nick(occupant_jid);
end

function room_mt:save_occupant(occupant)
	occupant = occupant_lib.copy(occupant); -- So that occupant can be modified more
	local id = occupant.nick

	-- Need to maintain _jid_nick secondary index
	local old_occupant = self._occupants[id];
	if old_occupant then
		for real_jid in old_occupant:each_session() do
			self._jid_nick[real_jid] = nil;
		end
	end

	local has_live_session = false
	if occupant.role ~= nil then
		for real_jid, presence in occupant:each_session() do
			if presence.attr.type == nil then
				has_live_session = true
				self._jid_nick[real_jid] = occupant.nick;
			end
		end
		if not has_live_session then
			-- Has no live sessions left; they have left the room.
			occupant.role = nil
		end
	end
	if not has_live_session then
		occupant = nil
	end
	self._occupants[id] = occupant
	return occupant
end

function room_mt:route_to_occupant(occupant, stanza)
	local to = stanza.attr.to;
	for jid in occupant:each_session() do
		stanza.attr.to = jid;
		self:route_stanza(stanza);
	end
	stanza.attr.to = to;
end

-- actor is the attribute table
local function add_item(x, affiliation, role, jid, nick, actor_nick, actor_jid, reason)
	x:tag("item", {affiliation = affiliation or "none"; role = role; jid = jid; nick = nick;})
	if actor_nick or actor_jid then
		x:tag("actor", {nick = actor_nick; jid = actor_jid;}):up()
	end
	if reason then
		x:tag("reason"):text(reason):up()
	end
	x:up();
	return x
end

-- actor is (real) jid
function room_mt:build_item_list(occupant, x, is_anonymous, nick, actor_nick, actor_jid, reason)
	local affiliation = self:get_affiliation(occupant.bare_jid) or "none";
	local role = occupant.role or "none";
	if is_anonymous then
		add_item(x, affiliation, role, nil, nick, actor_nick, actor_jid, reason);
	else
		for real_jid in occupant:each_session() do
			add_item(x, affiliation, role, real_jid, nick, actor_nick, actor_jid, reason);
		end
	end
	return x
end

function room_mt:broadcast_message(stanza)
	if module:fire_event("muc-broadcast-message", {room = self, stanza = stanza}) then
		return true;
	end
	self:broadcast(stanza);
	return true;
end

-- Strip delay tags claiming to be from us
module:hook("muc-occupant-groupchat", function (event)
	local stanza = event.stanza;
	local room = event.room;
	local room_jid = room.jid;

	stanza:maptags(function (child)
		if child.name == "delay" and child.attr["xmlns"] == "urn:xmpp:delay" then
			if child.attr["from"] == room_jid then
				return nil;
			end
		end
		if child.name == "x" and child.attr["xmlns"] == "jabber:x:delay" then
			if child.attr["from"] == room_jid then
				return nil;
			end
		end
		return child;
	end)
end);

-- Broadcast a stanza to all occupants in the room.
-- optionally checks conditional called with (nick, occupant)
function room_mt:broadcast(stanza, cond_func)
	for nick, occupant in self:each_occupant() do
		if cond_func == nil or cond_func(nick, occupant) then
			self:route_to_occupant(occupant, stanza)
		end
	end
end

local function can_see_real_jids(whois, occupant)
	if whois == "anyone" then
		return true;
	elseif whois == "moderators" then
		return valid_roles[occupant.role or "none"] >= valid_roles.moderator;
	end
end

-- Broadcasts an occupant's presence to the whole room
-- Takes the x element that goes into the stanzas
function room_mt:publicise_occupant_status(occupant, x, nick, actor, reason)
	local base_x = x.base or x;
	-- Build real jid and (optionally) occupant jid template presences
	local base_presence do
		-- Try to use main jid's presence
		local pr = occupant:get_presence();
		if pr and (occupant.role ~= nil or pr.attr.type == "unavailable") then
			base_presence = st.clone(pr);
		else -- user is leaving but didn't send a leave presence. make one for them
			base_presence = st.presence {from = occupant.nick; type = "unavailable";};
		end
	end

	-- Fire event (before full_p and anon_p are created)
	local event = {
		room = self; stanza = base_presence; x = base_x;
		occupant = occupant; nick = nick; actor = actor;
		reason = reason;
	}
	module:fire_event("muc-broadcast-presence", event);

	-- Allow muc-broadcast-presence listeners to change things
	nick = event.nick;
	actor = event.actor;
	reason = event.reason;

	local whois = self:get_whois();

	local actor_nick;
	if actor then
		actor_nick = jid_resource(self:get_occupant_jid(actor));
	end

	local full_p, full_x;
	local function get_full_p()
		if full_p == nil then
			full_x = st.clone(x.full or base_x);
			self:build_item_list(occupant, full_x, false, nick, actor_nick, actor, reason);
			full_p = st.clone(base_presence):add_child(full_x);
		end
		return full_p, full_x;
	end

	local anon_p, anon_x;
	local function get_anon_p()
		if anon_p == nil then
			anon_x = st.clone(x.anon or base_x);
			self:build_item_list(occupant, anon_x, true, nick, actor_nick, nil, reason);
			anon_p = st.clone(base_presence):add_child(anon_x);
		end
		return anon_p, anon_x;
	end

	local self_p, self_x;
	do
		-- Can always see your own full jids
		-- But not allowed to see actor's
		self_x = st.clone(x.self or base_x);
		self:build_item_list(occupant, self_x, false, nick, actor_nick, nil, reason);
		self_p = st.clone(base_presence):add_child(self_x);
	end

	-- General populance
	for occupant_nick, n_occupant in self:each_occupant() do
		if occupant_nick ~= occupant.nick then
			local pr;
			if can_see_real_jids(whois, n_occupant) then
				pr = get_full_p();
			elseif occupant.bare_jid == n_occupant.bare_jid then
				pr = self_p;
			else
				pr = get_anon_p();
			end
			self:route_to_occupant(n_occupant, pr);
		end
	end

	-- Presences for occupant itself
	self_x:tag("status", {code = "110";}):up();
	if occupant.role == nil then
		-- They get an unavailable
		self:route_to_occupant(occupant, self_p);
	else
		-- use their own presences as templates
		for full_jid, pr in occupant:each_session() do
			pr = st.clone(pr);
			pr.attr.to = full_jid;
			pr:add_child(self_x);
			self:route_stanza(pr);
		end
	end
end

function room_mt:send_occupant_list(to, filter)
	local to_bare = jid_bare(to);
	local is_anonymous = false;
	local whois = self:get_whois();
	if whois ~= "anyone" then
		local affiliation = self:get_affiliation(to);
		if affiliation ~= "admin" and affiliation ~= "owner" then
			local occupant = self:get_occupant_by_real_jid(to);
			if not (occupant and can_see_real_jids(whois, occupant)) then
				is_anonymous = true;
			end
		end
	end
	for occupant_jid, occupant in self:each_occupant() do
		if filter == nil or filter(occupant_jid, occupant) then
			local x = st.stanza("x", {xmlns='http://jabber.org/protocol/muc#user'});
			self:build_item_list(occupant, x, is_anonymous and to_bare ~= occupant.bare_jid); -- can always see your own jids
			local pres = st.clone(occupant:get_presence());
			pres.attr.to = to;
			pres:add_child(x);
			self:route_stanza(pres);
		end
	end
end

function room_mt:get_disco_info(stanza)
	local node = stanza.tags[1].attr.node or "";
	local reply = st.reply(stanza):tag("query", { xmlns = "http://jabber.org/protocol/disco#info", node = node });
	local event_name = "muc-disco#info";
	local event_data = { room = self, reply = reply, stanza = stanza };

	if node ~= "" then
		event_name = event_name.."/"..node;
	else
		event_data.form = dataform.new {
			{ name = "FORM_TYPE", type = "hidden", value = "http://jabber.org/protocol/muc#roominfo" };
		};
		event_data.formdata = {};
	end
	module:fire_event(event_name, event_data);
	if event_data.form then
		reply:add_child(event_data.form:form(event_data.formdata, "result"));
	end
	return reply;
end
module:hook("muc-disco#info", function(event)
	event.reply:tag("feature", {var = "http://jabber.org/protocol/muc"}):up();
	event.reply:tag("feature", {var = "http://jabber.org/protocol/muc#stable_id"}):up();
	event.reply:tag("feature", {var = "http://jabber.org/protocol/muc#self-ping-optimization"}):up();
end);
module:hook("muc-disco#info", function(event)
	table.insert(event.form, { name = "muc#roominfo_occupants", label = "Number of occupants" });
	event.formdata["muc#roominfo_occupants"] = tostring(iterators.count(event.room:each_occupant()));
end);

function room_mt:get_disco_items(stanza) -- luacheck: ignore 212
	return st.reply(stanza):query("http://jabber.org/protocol/disco#items");
end

function room_mt:handle_kickable(origin, stanza) -- luacheck: ignore 212
	local real_jid = stanza.attr.from;
	local occupant = self:get_occupant_by_real_jid(real_jid);
	if occupant == nil then return nil; end
	local type, condition, text = stanza:get_error();
	local error_message = "Kicked: "..(condition and condition:gsub("%-", " ") or "presence error");
	if text and self:get_whois() == "anyone" then
		error_message = error_message..": "..text;
	end
	occupant:set_session(real_jid, st.presence({type="unavailable"})
		:tag('status'):text(error_message));
	local is_last_session = occupant.jid == real_jid;
	if is_last_session then
		occupant.role = nil;
	end
	local new_occupant = self:save_occupant(occupant);
	local x = st.stanza("x", {xmlns = "http://jabber.org/protocol/muc#user";});
	if is_last_session then
		x:tag("status", {code = "333"});
	end
	self:publicise_occupant_status(new_occupant or occupant, x);
	if is_last_session then
		module:fire_event("muc-occupant-left", {room = self; nick = occupant.nick; occupant = occupant;});
	end
	return true;
end

-- Give the room creator owner affiliation
module:hook("muc-room-pre-create", function(event)
	event.room:set_affiliation(true, jid_bare(event.stanza.attr.from), "owner");
end, -1);

-- check if user is banned
module:hook("muc-occupant-pre-join", function(event)
	local room, stanza = event.room, event.stanza;
	local affiliation = room:get_affiliation(stanza.attr.from);
	if affiliation == "outcast" then
		local reply = st.error_reply(stanza, "auth", "forbidden"):up();
		reply.tags[1].attr.code = "403";
		event.origin.send(reply:tag("x", {xmlns = "http://jabber.org/protocol/muc"}));
		return true;
	end
end, -10);

module:hook("muc-occupant-pre-join", function(event)
	local nick = jid_resource(event.occupant.nick);
	if not nick:find("%S") then
		event.origin.send(st.error_reply(event.stanza, "modify", "not-allowed", "Invisible Nicknames are forbidden"));
		return true;
	end
end, 1);

module:hook("muc-occupant-pre-change", function(event)
	if not jid_resource(event.dest_occupant.nick):find("%S") then
		event.origin.send(st.error_reply(event.stanza, "modify", "not-allowed", "Invisible Nicknames are forbidden"));
		return true;
	end
end, 1);

function room_mt:handle_first_presence(origin, stanza)
	if not stanza:get_child("x", "http://jabber.org/protocol/muc") then
		module:log("debug", "Room creation without <x>, possibly desynced");

		origin.send(st.error_reply(stanza, "cancel", "item-not-found"));
		return true;
	end

	local real_jid = stanza.attr.from;
	local dest_jid = stanza.attr.to;
	local bare_jid = jid_bare(real_jid);
	if module:fire_event("muc-room-pre-create", {
			room = self;
			origin = origin;
			stanza = stanza;
		}) then return true; end
	local is_first_dest_session = true;
	local dest_occupant = self:new_occupant(bare_jid, dest_jid);

	local orig_nick = dest_occupant.nick;
	if module:fire_event("muc-occupant-pre-join", {
		room = self;
		origin = origin;
		stanza = stanza;
		is_first_session = is_first_dest_session;
		is_new_room = true;
		occupant = dest_occupant;
	}) then return true; end
	local nick_changed = orig_nick ~= dest_occupant.nick;

	dest_occupant:set_session(real_jid, stanza);
	local dest_x = st.stanza("x", {xmlns = "http://jabber.org/protocol/muc#user";});
	dest_x:tag("status", {code = "201"}):up();
	if self:get_whois() == "anyone" then
		dest_x:tag("status", {code = "100"}):up();
	end
	if nick_changed then
		dest_x:tag("status", {code = "210"}):up();
	end
	self:save_occupant(dest_occupant);

	self:publicise_occupant_status(dest_occupant, dest_x);

	module:fire_event("muc-occupant-joined", {
		room = self;
		nick = dest_occupant.nick;
		occupant = dest_occupant;
		stanza = stanza;
		origin = origin;
	});
	module:fire_event("muc-occupant-session-new", {
		room = self;
		nick = dest_occupant.nick;
		occupant = dest_occupant;
		stanza = stanza;
		origin = origin;
		jid = real_jid;
	});
	module:fire_event("muc-room-created", {
		room = self;
		creator = dest_occupant;
		stanza = stanza;
		origin = origin;
	});
	return true;
end

function room_mt:handle_normal_presence(origin, stanza)
	local type = stanza.attr.type;
	local real_jid = stanza.attr.from;
	local bare_jid = jid_bare(real_jid);
	local orig_occupant = self:get_occupant_by_real_jid(real_jid);
	local muc_x = stanza:get_child("x", "http://jabber.org/protocol/muc");

	if orig_occupant == nil and not muc_x and stanza.attr.type == nil then
		module:log("debug", "Attempted join without <x>, possibly desynced");
		origin.send(st.error_reply(stanza, "cancel", "item-not-found",
			"You must join the room before sending presence updates"));
		return true;
	end

	local is_first_dest_session;
	local dest_occupant;
	if type == "unavailable" then
		if orig_occupant == nil then return true; end -- Unavailable from someone not in the room
		-- dest_occupant = nil
	elseif orig_occupant and orig_occupant.nick == stanza.attr.to then -- Just a presence update
		log("debug", "presence update for %s from session %s", orig_occupant.nick, real_jid);
		dest_occupant = orig_occupant;
	else
		local dest_jid = stanza.attr.to;
		dest_occupant = self:get_occupant_by_nick(dest_jid);
		if dest_occupant == nil then
			log("debug", "no occupant found for %s; creating new occupant object for %s", dest_jid, real_jid);
			is_first_dest_session = true;
			dest_occupant = self:new_occupant(bare_jid, dest_jid);
			if orig_occupant then
				dest_occupant.role = orig_occupant.role;
			end
		else
			is_first_dest_session = false;
		end
	end
	local is_last_orig_session;
	if orig_occupant ~= nil then
		-- Is there are least 2 sessions?
		local iter, ob, last = orig_occupant:each_session();
		is_last_orig_session = iter(ob, iter(ob, last)) == nil;
	end

	local orig_nick = dest_occupant and dest_occupant.nick;

	local event, event_name = {
		room = self;
		origin = origin;
		stanza = stanza;
		is_first_session = is_first_dest_session;
		is_last_session = is_last_orig_session;
	};
	if orig_occupant == nil then
		event_name = "muc-occupant-pre-join";
		event.occupant = dest_occupant;
	elseif dest_occupant == nil then
		event_name = "muc-occupant-pre-leave";
		event.occupant = orig_occupant;
	else
		event_name = "muc-occupant-pre-change";
		event.orig_occupant = orig_occupant;
		event.dest_occupant = dest_occupant;
	end
	if module:fire_event(event_name, event) then return true; end

	local nick_changed = dest_occupant and orig_nick ~= dest_occupant.nick;

	-- Check for nick conflicts
	if dest_occupant ~= nil and not is_first_dest_session
		and bare_jid ~= jid_bare(dest_occupant.bare_jid) then
		-- new nick or has different bare real jid
		log("debug", "%s couldn't join due to nick conflict: %s", real_jid, dest_occupant.nick);
		local reply = st.error_reply(stanza, "cancel", "conflict"):up();
		reply.tags[1].attr.code = "409";
		origin.send(reply:tag("x", {xmlns = "http://jabber.org/protocol/muc"}));
		return true;
	end

	-- Send presence stanza about original occupant
	if orig_occupant ~= nil and orig_occupant ~= dest_occupant then
		local orig_x = st.stanza("x", {xmlns = "http://jabber.org/protocol/muc#user";});
		local dest_nick;
		if dest_occupant == nil then -- Session is leaving
			log("debug", "session %s is leaving occupant %s", real_jid, orig_occupant.nick);
			if is_last_orig_session then
				orig_occupant.role = nil;
			end
			orig_occupant:set_session(real_jid, stanza);
		else
			log("debug", "session %s is changing from occupant %s to %s", real_jid, orig_occupant.nick, dest_occupant.nick);
			local generated_unavail = st.presence {from = orig_occupant.nick, to = real_jid, type = "unavailable"};
			orig_occupant:set_session(real_jid, generated_unavail);
			dest_nick = jid_resource(dest_occupant.nick);
			if not is_first_dest_session then -- User is swapping into another pre-existing session
				log("debug", "session %s is swapping into multisession %s, showing it leave.", real_jid, dest_occupant.nick);
				-- Show the other session leaving
				local x = st.stanza("x", {xmlns = "http://jabber.org/protocol/muc#user";});
				add_item(x, self:get_affiliation(bare_jid), "none");
				local pr = st.presence{from = dest_occupant.nick, to = real_jid, type = "unavailable"}
					:tag("status"):text("you are joining pre-existing session " .. dest_nick):up()
					:add_child(x);
				self:route_stanza(pr);
			end
			if is_first_dest_session and is_last_orig_session then -- Normal nick change
				log("debug", "no sessions in %s left; publicly marking as nick change", orig_occupant.nick);
				orig_x:tag("status", {code = "303";}):up();
			else -- The session itself always needs to see a nick change
				-- don't want to get our old nick's available presence,
				-- so remove our session from there, and manually generate an unavailable
				orig_occupant:remove_session(real_jid);
				log("debug", "generating nick change for %s", real_jid);
				local x = st.stanza("x", {xmlns = "http://jabber.org/protocol/muc#user";});
				-- COMPAT: clients get confused if they see other items besides their own
				-- self:build_item_list(orig_occupant, x, false, dest_nick);
				add_item(x, self:get_affiliation(bare_jid), orig_occupant.role, real_jid, dest_nick);
				x:tag("status", {code = "303";}):up();
				x:tag("status", {code = "110";}):up();
				self:route_stanza(generated_unavail:add_child(x));
				dest_nick = nil; -- set dest_nick to nil; so general populance doesn't see it for whole orig_occupant
			end
		end

		self:save_occupant(orig_occupant);
		self:publicise_occupant_status(orig_occupant, orig_x, dest_nick);

		if is_last_orig_session then
			module:fire_event("muc-occupant-left", {
				room = self;
				nick = orig_occupant.nick;
				occupant = orig_occupant;
				origin = origin;
				stanza = stanza;
			});
		end
	end

	if dest_occupant ~= nil then
		dest_occupant:set_session(real_jid, stanza);
		self:save_occupant(dest_occupant);

		if orig_occupant == nil or muc_x then
			-- Send occupant list to newly joined or desynced user
			self:send_occupant_list(real_jid, function(nick, occupant) -- luacheck: ignore 212
				-- Don't include self
				return occupant:get_presence(real_jid) == nil;
			end)
		end
		local dest_x = st.stanza("x", {xmlns = "http://jabber.org/protocol/muc#user";});
		local self_x = st.clone(dest_x);
		if orig_occupant == nil and self:get_whois() == "anyone" then
			self_x:tag("status", {code = "100"}):up();
		end
		if nick_changed then
			self_x:tag("status", {code="210"}):up();
		end
		self:publicise_occupant_status(dest_occupant, {base=dest_x,self=self_x});

		if orig_occupant ~= nil and orig_occupant ~= dest_occupant and not is_last_orig_session then
			-- If user is swapping and wasn't last original session
			log("debug", "session %s split nicks; showing %s rejoining", real_jid, orig_occupant.nick);
			-- Show the original nick joining again
			local pr = st.clone(orig_occupant:get_presence());
			pr.attr.to = real_jid;
			local x = st.stanza("x", {xmlns = "http://jabber.org/protocol/muc#user";});
			self:build_item_list(orig_occupant, x, false);
			-- TODO: new status code to inform client this was the multi-session it left?
			pr:add_child(x);
			self:route_stanza(pr);
		end

		if orig_occupant == nil or muc_x then
			if is_first_dest_session then
				module:fire_event("muc-occupant-joined", {
					room = self;
					nick = dest_occupant.nick;
					occupant = dest_occupant;
					stanza = stanza;
					origin = origin;
				});
			end
			module:fire_event("muc-occupant-session-new", {
				room = self;
				nick = dest_occupant.nick;
				occupant = dest_occupant;
				stanza = stanza;
				origin = origin;
				jid = real_jid;
			});
		end
	end
	return true;
end

function room_mt:handle_presence_to_occupant(origin, stanza)
	local type = stanza.attr.type;
	if type == "error" then -- error, kick em out!
		return self:handle_kickable(origin, stanza)
	elseif type == nil or type == "unavailable" then
		return self:handle_normal_presence(origin, stanza);
	elseif type ~= 'result' then -- bad type
		if type ~= 'visible' and type ~= 'invisible' then -- COMPAT ejabberd can broadcast or forward XEP-0018 presences
			origin.send(st.error_reply(stanza, "modify", "bad-request")); -- FIXME correct error?
		end
	end
	return true;
end

function room_mt:handle_iq_to_occupant(origin, stanza)
	local from, to = stanza.attr.from, stanza.attr.to;
	local type = stanza.attr.type;
	local id = stanza.attr.id;
	local occupant = self:get_occupant_by_nick(to);
	if (type == "error" or type == "result") then
		do -- deconstruct_stanza_id
			if not occupant then return nil; end
			local from_jid, orig_id, to_jid_hash = (base64.decode(id) or ""):match("^(%Z+)%z(%Z*)%z(.+)$");
			if not(from == from_jid or from == jid_bare(from_jid)) then return nil; end
			local from_occupant_jid = self:get_occupant_jid(from_jid);
			if from_occupant_jid == nil then return nil; end
			local session_jid
			for to_jid in occupant:each_session() do
				if md5(to_jid) == to_jid_hash then
					session_jid = to_jid;
					break;
				end
			end
			if session_jid == nil then return nil; end
			stanza.attr.from, stanza.attr.to, stanza.attr.id = from_occupant_jid, session_jid, orig_id;
		end
		log("debug", "%s sent private iq stanza to %s (%s)", from, to, stanza.attr.to);
		self:route_stanza(stanza);
		stanza.attr.from, stanza.attr.to, stanza.attr.id = from, to, id;
		return true;
	else -- Type is "get" or "set"
		local current_nick = self:get_occupant_jid(from);
		if not current_nick then
			origin.send(st.error_reply(stanza, "cancel", "not-acceptable", "You are not currently connected to this chat"));
			return true;
		end
		if not occupant then -- recipient not in room
			origin.send(st.error_reply(stanza, "cancel", "item-not-found", "Recipient not in room"));
			return true;
		end
		-- XEP-0410 MUC Self-Ping #1220
		if to == current_nick and stanza.attr.type == "get" and stanza:get_child("ping", "urn:xmpp:ping") then
			self:route_stanza(st.reply(stanza));
			return true;
		end
		do -- construct_stanza_id
			stanza.attr.id = base64.encode(occupant.jid.."\0"..stanza.attr.id.."\0"..md5(from));
		end
		stanza.attr.from, stanza.attr.to = current_nick, occupant.jid;
		log("debug", "%s sent private iq stanza to %s (%s)", from, to, occupant.jid);
		local iq_ns = stanza.tags[1].attr.xmlns;
		if iq_ns == 'vcard-temp' or iq_ns == "http://jabber.org/protocol/pubsub" or iq_ns == "urn:ietf:params:xml:ns:vcard-4.0" then
			stanza.attr.to = jid_bare(stanza.attr.to);
		end
		self:route_stanza(stanza);
		stanza.attr.from, stanza.attr.to, stanza.attr.id = from, to, id;
		return true;
	end
end

function room_mt:handle_message_to_occupant(origin, stanza)
	local from, to = stanza.attr.from, stanza.attr.to;
	local current_nick = self:get_occupant_jid(from);
	local type = stanza.attr.type;
	if not current_nick then -- not in room
		if type ~= "error" then
			origin.send(st.error_reply(stanza, "cancel", "not-acceptable", "You are not currently connected to this chat"));
		end
		return true;
	end
	if type == "groupchat" then -- groupchat messages not allowed in PM
		origin.send(st.error_reply(stanza, "modify", "bad-request"));
		return true;
	elseif type == "error" and is_kickable_error(stanza) then
		log("debug", "%s kicked from %s for sending an error message", current_nick, self.jid);
		return self:handle_kickable(origin, stanza); -- send unavailable
	end

	local o_data = self:get_occupant_by_nick(to);
	if not o_data then
		origin.send(st.error_reply(stanza, "cancel", "item-not-found", "Recipient not in room"));
		return true;
	end
	log("debug", "%s sent private message stanza to %s (%s)", from, to, o_data.jid);
	stanza = muc_util.filter_muc_x(st.clone(stanza));
	stanza:tag("x", { xmlns = "http://jabber.org/protocol/muc#user" }):up();
	stanza.attr.from = current_nick;
	self:route_to_occupant(o_data, stanza)
	-- TODO: Remove x tag?
	stanza.attr.from = from;
	return true;
end

function room_mt:send_form(origin, stanza)
	origin.send(st.reply(stanza):query("http://jabber.org/protocol/muc#owner")
		:add_child(self:get_form_layout(stanza.attr.from):form())
	);
end

function room_mt:get_form_layout(actor)
	local form = dataform.new({
		title = "Configuration for "..self.jid,
		instructions = "Complete and submit this form to configure the room.",
		{
			name = 'FORM_TYPE',
			type = 'hidden',
			value = 'http://jabber.org/protocol/muc#roomconfig'
		}
	});
	return module:fire_event("muc-config-form", { room = self, actor = actor, form = form }) or form;
end

function room_mt:process_form(origin, stanza)
	local form = stanza.tags[1]:get_child("x", "jabber:x:data");
	if form.attr.type == "cancel" then
		origin.send(st.reply(stanza));
	elseif form.attr.type == "submit" then
		local fields, errors, present;
		if form.tags[1] == nil then -- Instant room
			fields, present = {}, {};
		else
			fields, errors, present = self:get_form_layout(stanza.attr.from):data(form);
			if fields.FORM_TYPE ~= "http://jabber.org/protocol/muc#roomconfig" then
				origin.send(st.error_reply(stanza, "cancel", "bad-request", "Form is not of type room configuration"));
				return true;
			end
		end

		local event = {
			room = self;
			origin = origin;
			stanza = stanza;
			fields = fields;
			status_codes = {};
			actor = stanza.attr.from;
		};
		function event.update_option(name, field, allowed)
			local new = fields[field];
			if new == nil then return; end
			if allowed and not allowed[new] then return; end
			if new == self["get_"..name](self) then return; end
			event.status_codes["104"] = true;
			self["set_"..name](self, new);
			return true;
		end
		module:fire_event("muc-config-submitted", event);
		for submitted_field in pairs(present) do
			event.field, event.value = submitted_field, fields[submitted_field];
			module:fire_event("muc-config-submitted/"..submitted_field, event);
		end
		event.field, event.value = nil, nil;

		self:save(true);
		origin.send(st.reply(stanza));

		if next(event.status_codes) then
			local msg = st.message({type='groupchat', from=self.jid})
				:tag('x', {xmlns='http://jabber.org/protocol/muc#user'})
			for code in pairs(event.status_codes) do
				msg:tag("status", {code = code;}):up();
			end
			msg:up();
			self:broadcast_message(msg);
		end
	else
		origin.send(st.error_reply(stanza, "cancel", "bad-request", "Not a submitted form"));
	end
	return true;
end

-- Removes everyone from the room
function room_mt:clear(x)
	x = x or st.stanza("x", {xmlns='http://jabber.org/protocol/muc#user'});
	local occupants_updated = {};
	for nick, occupant in self:each_occupant() do -- luacheck: ignore 213
		occupant.role = nil;
		self:save_occupant(occupant);
		occupants_updated[occupant] = true;
	end
	for occupant in pairs(occupants_updated) do
		self:publicise_occupant_status(occupant, x);
		module:fire_event("muc-occupant-left", { room = self; nick = occupant.nick; occupant = occupant;});
	end
end

function room_mt:destroy(newjid, reason, password)
	local x = st.stanza("x", {xmlns = "http://jabber.org/protocol/muc#user"})
		:tag("destroy", {jid=newjid});
	if reason then x:tag("reason"):text(reason):up(); end
	if password then x:tag("password"):text(password):up(); end
	x:up();
	self.destroying = reason or true;
	self:clear(x);
	module:fire_event("muc-room-destroyed", { room = self, reason = reason, newjid = newjid, password = password });
	return true;
end

function room_mt:handle_disco_info_get_query(origin, stanza)
	origin.send(self:get_disco_info(stanza));
	return true;
end

function room_mt:handle_disco_items_get_query(origin, stanza)
	origin.send(self:get_disco_items(stanza));
	return true;
end

function room_mt:handle_admin_query_set_command(origin, stanza)
	local item = stanza.tags[1].tags[1];
	if not item then
		origin.send(st.error_reply(stanza, "cancel", "bad-request"));
		return true;
	end
	if item.attr.jid then -- Validate provided JID
		item.attr.jid = jid_prep(item.attr.jid);
		if not item.attr.jid then
			origin.send(st.error_reply(stanza, "modify", "jid-malformed"));
			return true;
		end
	end
	if item.attr.nick then -- Validate provided nick
		item.attr.nick = resourceprep(item.attr.nick);
		if not item.attr.nick then
			origin.send(st.error_reply(stanza, "modify", "jid-malformed", "invalid nickname"));
			return true;
		end
	end
	if not item.attr.jid and item.attr.nick then
		-- COMPAT Workaround for Miranda sending 'nick' instead of 'jid' when changing affiliation
		local occupant = self:get_occupant_by_nick(self.jid.."/"..item.attr.nick);
		if occupant then item.attr.jid = occupant.bare_jid; end
	elseif item.attr.role and not item.attr.nick and item.attr.jid then
		-- Role changes should use nick, but we have a JID so pull the nick from that
		local nick = self:get_occupant_jid(item.attr.jid);
		if nick then item.attr.nick = jid_resource(nick); end
	end
	local actor = stanza.attr.from;
	local reason = item:get_child_text("reason");
	local success, errtype, err
	if item.attr.affiliation and item.attr.jid and not item.attr.role then
		local registration_data;
		if item.attr.nick then
			local room_nick = self.jid.."/"..item.attr.nick;
			local existing_occupant = self:get_occupant_by_nick(room_nick);
			if existing_occupant and existing_occupant.bare_jid ~= item.attr.jid then
				module:log("debug", "Existing occupant for %s: %s does not match %s", room_nick, existing_occupant.bare_jid, item.attr.jid);
				self:set_role(true, room_nick, nil, "This nickname is reserved");
			end
			module:log("debug", "Reserving %s for %s (%s)", item.attr.nick, item.attr.jid, item.attr.affiliation);
			registration_data = { reserved_nickname = item.attr.nick };
		end
		success, errtype, err = self:set_affiliation(actor, item.attr.jid, item.attr.affiliation, reason, registration_data);
	elseif item.attr.role and item.attr.nick and not item.attr.affiliation then
		success, errtype, err = self:set_role(actor, self.jid.."/"..item.attr.nick, item.attr.role, reason);
	else
		success, errtype, err = nil, "cancel", "bad-request";
	end
	self:save(true);
	if not success then
		origin.send(st.error_reply(stanza, errtype, err));
	else
		origin.send(st.reply(stanza));
	end
	return true;
end

function room_mt:handle_admin_query_get_command(origin, stanza)
	local actor = stanza.attr.from;
	local affiliation = self:get_affiliation(actor);
	local item = stanza.tags[1].tags[1];
	local _aff = item.attr.affiliation;
	local _aff_rank = valid_affiliations[_aff or "none"];
	local _rol = item.attr.role;
	if _aff and _aff_rank and not _rol then
		-- You need to be at least an admin, and be requesting info about your affifiliation or lower
		-- e.g. an admin can't ask for a list of owners
		local affiliation_rank = valid_affiliations[affiliation or "none"];
		if (affiliation_rank >= valid_affiliations.admin and affiliation_rank >= _aff_rank)
		or (self:get_whois() == "anyone") then
			local reply = st.reply(stanza):query("http://jabber.org/protocol/muc#admin");
			for jid in self:each_affiliation(_aff or "none") do
				local nick = self:get_registered_nick(jid);
				reply:tag("item", {affiliation = _aff, jid = jid, nick = nick }):up();
			end
			origin.send(reply:up());
			return true;
		else
			origin.send(st.error_reply(stanza, "auth", "forbidden"));
			return true;
		end
	elseif _rol and valid_roles[_rol or "none"] and not _aff then
		local role = self:get_role(self:get_occupant_jid(actor)) or self:get_default_role(affiliation);
		if valid_roles[role or "none"] >= valid_roles.moderator then
			if _rol == "none" then _rol = nil; end
			local reply = st.reply(stanza):query("http://jabber.org/protocol/muc#admin");
			-- TODO: whois check here? (though fully anonymous rooms are not supported)
			for occupant_jid, occupant in self:each_occupant() do
				if occupant.role == _rol then
					local nick = jid_resource(occupant_jid);
					self:build_item_list(occupant, reply, false, nick);
				end
			end
			origin.send(reply:up());
			return true;
		else
			origin.send(st.error_reply(stanza, "auth", "forbidden"));
			return true;
		end
	else
		origin.send(st.error_reply(stanza, "cancel", "bad-request"));
		return true;
	end
end

function room_mt:handle_owner_query_get_to_room(origin, stanza)
	if self:get_affiliation(stanza.attr.from) ~= "owner" then
		origin.send(st.error_reply(stanza, "auth", "forbidden", "Only owners can configure rooms"));
		return true;
	end

	self:send_form(origin, stanza);
	return true;
end
function room_mt:handle_owner_query_set_to_room(origin, stanza)
	if self:get_affiliation(stanza.attr.from) ~= "owner" then
		origin.send(st.error_reply(stanza, "auth", "forbidden", "Only owners can configure rooms"));
		return true;
	end

	local child = stanza.tags[1].tags[1];
	if not child then
		origin.send(st.error_reply(stanza, "modify", "bad-request"));
		return true;
	elseif child.name == "destroy" then
		local newjid = child.attr.jid;
		local reason = child:get_child_text("reason");
		local password = child:get_child_text("password");
		self:destroy(newjid, reason, password);
		origin.send(st.reply(stanza));
		return true;
	elseif child.name == "x" and child.attr.xmlns == "jabber:x:data" then
		return self:process_form(origin, stanza);
	else
		origin.send(st.error_reply(stanza, "cancel", "service-unavailable"));
		return true;
	end
end

function room_mt:handle_groupchat_to_room(origin, stanza)
	local from = stanza.attr.from;
	local occupant = self:get_occupant_by_real_jid(from);
	if module:fire_event("muc-occupant-groupchat", {
		room = self; origin = origin; stanza = stanza; from = from; occupant = occupant;
	}) then return true; end
	stanza.attr.from = occupant.nick;
	self:broadcast_message(stanza);
	stanza.attr.from = from;
	return true;
end

-- Role check
module:hook("muc-occupant-groupchat", function(event)
	local role_rank = valid_roles[event.occupant and event.occupant.role or "none"];
	if role_rank <= valid_roles.none then
		event.origin.send(st.error_reply(event.stanza, "cancel", "not-acceptable", "You are not currently connected to this chat"));
		return true;
	elseif role_rank <= valid_roles.visitor then
		event.origin.send(st.error_reply(event.stanza, "auth", "forbidden"));
		return true;
	end
end, 50);

-- hack - some buggy clients send presence updates to the room rather than their nick
function room_mt:handle_presence_to_room(origin, stanza)
	local current_nick = self:get_occupant_jid(stanza.attr.from);
	local handled
	if current_nick then
		local to = stanza.attr.to;
		stanza.attr.to = current_nick;
		handled = self:handle_presence_to_occupant(origin, stanza);
		stanza.attr.to = to;
	end
	return handled;
end

-- Need visitor role or higher to invite
module:hook("muc-pre-invite", function(event)
	local room, stanza = event.room, event.stanza;
	local _from = stanza.attr.from;
	local inviter = room:get_occupant_by_real_jid(_from);
	local role = inviter and inviter.role or room:get_default_role(room:get_affiliation(_from));
	if valid_roles[role or "none"] <= valid_roles.visitor then
		event.origin.send(st.error_reply(stanza, "auth", "forbidden"));
		return true;
	end
end);

function room_mt:handle_mediated_invite(origin, stanza)
	local payload = stanza:get_child("x", "http://jabber.org/protocol/muc#user"):get_child("invite");
	local invitee = jid_prep(payload.attr.to);
	if not invitee then
		origin.send(st.error_reply(stanza, "cancel", "jid-malformed"));
		return true;
	elseif module:fire_event("muc-pre-invite", {room = self, origin = origin, stanza = stanza}) then
		return true;
	end
	local invite = muc_util.filter_muc_x(st.clone(stanza));
	invite.attr.from = self.jid;
	invite.attr.to = invitee;
	invite:tag('x', {xmlns='http://jabber.org/protocol/muc#user'})
			:tag('invite', {from = stanza.attr.from;})
				:tag('reason'):text(payload:get_child_text("reason")):up()
			:up()
		:up();
	if not module:fire_event("muc-invite", {room = self, stanza = invite, origin = origin, incoming = stanza}) then
		self:route_stanza(invite);
	end
	return true;
end

-- COMPAT: Some older clients expect this
module:hook("muc-invite", function(event)
	local room, stanza = event.room, event.stanza;
	local invite = stanza:get_child("x", "http://jabber.org/protocol/muc#user"):get_child("invite");
	local reason = invite:get_child_text("reason");
	stanza:tag('x', {xmlns = "jabber:x:conference"; jid = room.jid;})
		:text(reason or "")
	:up();
end);

-- Add a plain message for clients which don't support invites
module:hook("muc-invite", function(event)
	local room, stanza = event.room, event.stanza;
	if not stanza:get_child("body") then
		local invite = stanza:get_child("x", "http://jabber.org/protocol/muc#user"):get_child("invite");
		local reason = invite:get_child_text("reason") or "";
		stanza:tag("body")
			:text(invite.attr.from.." invited you to the room "..room.jid..(reason ~= "" and (" ("..reason..")") or ""))
		:up();
	end
end);

function room_mt:handle_mediated_decline(origin, stanza)
	local payload = stanza:get_child("x", "http://jabber.org/protocol/muc#user"):get_child("decline");
	local declinee = jid_prep(payload.attr.to);
	if not declinee then
		origin.send(st.error_reply(stanza, "cancel", "jid-malformed"));
		return true;
	elseif module:fire_event("muc-pre-decline", {room = self, origin = origin, stanza = stanza}) then
		return true;
	end
	local decline = muc_util.filter_muc_x(st.clone(stanza));
	decline.attr.from = self.jid;
	decline.attr.to = declinee;
	decline:tag("x", {xmlns = "http://jabber.org/protocol/muc#user"})
			:tag("decline", {from = stanza.attr.from})
				:tag("reason"):text(payload:get_child_text("reason")):up()
			:up()
		:up();
	if not module:fire_event("muc-decline", {room = self, stanza = decline, origin = origin, incoming = stanza}) then
		declinee = decline.attr.to; -- re-fetch, in case event modified it
		local occupant
		if jid_bare(declinee) == self.jid then -- declinee jid is already an in-room jid
			occupant = self:get_occupant_by_nick(declinee);
		end
		if occupant then
			self:route_to_occupant(occupant, decline);
		else
			self:route_stanza(decline);
		end
	end
	return true;
end

-- Add a plain message for clients which don't support declines
module:hook("muc-decline", function(event)
	local room, stanza = event.room, event.stanza;
	if not stanza:get_child("body") then
		local decline = stanza:get_child("x", "http://jabber.org/protocol/muc#user"):get_child("decline");
		local reason = decline:get_child_text("reason") or "";
		stanza:body(decline.attr.from.." declined your invite to the room "
			..room.jid..(reason ~= "" and (" ("..reason..")") or ""));
	end
end);

function room_mt:handle_message_to_room(origin, stanza)
	local type = stanza.attr.type;
	if type == "groupchat" then
		return self:handle_groupchat_to_room(origin, stanza)
	elseif type == "error" and is_kickable_error(stanza) then
		return self:handle_kickable(origin, stanza)
	elseif type == nil or type == "normal" then
		local x = stanza:get_child("x", "http://jabber.org/protocol/muc#user");
		if x then
			local payload = x.tags[1];
			if payload == nil then --luacheck: ignore 542
				-- fallthrough
			elseif payload.name == "invite" and payload.attr.to then
				return self:handle_mediated_invite(origin, stanza)
			elseif payload.name == "decline" and payload.attr.to then
				return self:handle_mediated_decline(origin, stanza)
			end
			origin.send(st.error_reply(stanza, "cancel", "bad-request"));
			return true;
		end

		local form = stanza:get_child("x", "jabber:x:data");
		local form_type = dataform.get_type(form);
		if form_type == "http://jabber.org/protocol/muc#request" then
			self:handle_role_request(origin, stanza, form);
			return true;
		end
	end
end

function room_mt:route_stanza(stanza) -- luacheck: ignore 212
	module:send(stanza);
end

function room_mt:get_affiliation(jid)
	local node, host, resource = jid_split(jid);
	-- Affiliations are granted, revoked, and maintained based on the user's bare JID.
	local bare = node and node.."@"..host or host;
	local result = self._affiliations[bare];
	if not result and self._affiliations[host] == "outcast" then result = "outcast"; end -- host banned
	return result;
end

-- Iterates over jid, affiliation pairs
function room_mt:each_affiliation(with_affiliation)
	local _affiliations, _affiliation_data = self._affiliations, self._affiliation_data;
	return function(_, jid)
		local affiliation;
		repeat -- Iterate until we get a match
			jid, affiliation = next(_affiliations, jid);
		until with_affiliation == nil or jid == nil or affiliation == with_affiliation
		return jid, affiliation, _affiliation_data[jid];
	end, nil, nil;
end

function room_mt:set_affiliation(actor, jid, affiliation, reason, data)
	if not actor then return nil, "modify", "not-acceptable"; end;

	local node, host, resource = jid_split(jid);
	if not host then return nil, "modify", "not-acceptable"; end
	jid = jid_join(node, host); -- Bare
	local is_host_only = node == nil;

	if valid_affiliations[affiliation or "none"] == nil then
		return nil, "modify", "not-acceptable";
	end
	affiliation = affiliation ~= "none" and affiliation or nil; -- coerces `affiliation == false` to `nil`

	local target_affiliation = self._affiliations[jid]; -- Raw; don't want to check against host
	local is_downgrade = valid_affiliations[target_affiliation or "none"] > valid_affiliations[affiliation or "none"];

	if actor == true then
		actor = nil -- So we can pass it safely to 'publicise_occupant_status' below
	else
		local actor_affiliation = self:get_affiliation(actor);
		if actor_affiliation == "owner" then
			if jid_bare(actor) == jid and is_downgrade then -- self change
				-- need at least one owner
				local is_last = true;
				for j in self:each_affiliation("owner") do
					if j ~= jid then is_last = false; break; end
				end
				if is_last then
					return nil, "cancel", "conflict";
				end
			end
			-- owners can do anything else
		elseif affiliation == "owner" or affiliation == "admin"
			or actor_affiliation ~= "admin"
			or target_affiliation == "owner" or target_affiliation == "admin" then
			-- Can't demote owners or other admins
			return nil, "cancel", "not-allowed";
		end
	end

	-- Set in 'database'
	self._affiliations[jid] = affiliation;
	if not affiliation or data == false or (data ~= nil and next(data) == nil) then
		module:log("debug", "Clearing affiliation data for %s", jid);
		self._affiliation_data[jid] = nil;
	elseif data then
		module:log("debug", "Updating affiliation data for %s", jid);
		self._affiliation_data[jid] = data;
	end

	-- Update roles
	local role = self:get_default_role(affiliation);
	local role_rank = valid_roles[role or "none"];
	local occupants_updated = {}; -- Filled with old roles
	for nick, occupant in self:each_occupant() do -- luacheck: ignore 213
		if occupant.bare_jid == jid or (
			-- Outcast can be by host.
			is_host_only and affiliation == "outcast" and select(2, jid_split(occupant.bare_jid)) == host
		) then
			-- need to publcize in all cases; as affiliation in <item/> has changed.
			occupants_updated[occupant] = occupant.role;
			if occupant.role ~= role and (
				is_downgrade or
				valid_roles[occupant.role or "none"] < role_rank -- upgrade
			) then
				occupant.role = role;
				self:save_occupant(occupant);
			end
		end
	end

	-- Tell the room of the new occupant affiliations+roles
	local x = st.stanza("x", {xmlns = "http://jabber.org/protocol/muc#user"});
	if not role then -- getting kicked
		if affiliation == "outcast" then
			x:tag("status", {code="301"}):up(); -- banned
		else
			x:tag("status", {code="321"}):up(); -- affiliation change
		end
	end
	local is_semi_anonymous = self:get_whois() == "moderators";

	if next(occupants_updated) ~= nil then
		for occupant, old_role in pairs(occupants_updated) do
			self:publicise_occupant_status(occupant, x, nil, actor, reason);
			if occupant.role == nil then
				module:fire_event("muc-occupant-left", {room = self; nick = occupant.nick; occupant = occupant;});
			elseif is_semi_anonymous and
				(old_role == "moderator" and occupant.role ~= "moderator") or
				(old_role ~= "moderator" and occupant.role == "moderator") then -- Has gained or lost moderator status
				-- Send everyone else's presences (as jid visibility has changed)
				for real_jid in occupant:each_session() do
					self:send_occupant_list(real_jid, function(occupant_jid, occupant) --luacheck: ignore 212 433
						return occupant.bare_jid ~= jid;
					end);
				end
			end
		end
	else
		-- Announce affiliation change for a user that is not currently in the room,
		-- XEP-0045 (v1.31.2) example 195
		-- add_item(x, affiliation, role, jid, nick, actor_nick, actor_jid, reason)
		local announce_msg = st.message({ from = self.jid })
			:add_child(add_item(st.clone(x), affiliation, nil, jid, nil, nil, nil, reason));
		local min_role = is_semi_anonymous and "moderator" or "none";
		self:broadcast(announce_msg, muc_util.only_with_min_role(min_role));
	end

	self:save(true);

	module:fire_event("muc-set-affiliation", {
		room = self;
		actor = actor;
		jid = jid;
		affiliation = affiliation or "none";
		reason = reason;
		previous_affiliation = target_affiliation;
		data = data and data or nil; -- coerce false to nil
		in_room = next(occupants_updated) ~= nil;
	});

	return true;
end

function room_mt:get_affiliation_data(jid, key)
	local data = self._affiliation_data[jid];
	if not data then return nil; end
	if key then
		return data[key];
	end
	return data;
end

function room_mt:get_role(nick)
	local occupant = self:get_occupant_by_nick(nick);
	return occupant and occupant.role or nil;
end

function room_mt:set_role(actor, occupant_jid, role, reason)
	if not actor then return nil, "modify", "not-acceptable"; end

	local occupant = self:get_occupant_by_nick(occupant_jid);
	if not occupant then return nil, "modify", "item-not-found"; end

	if valid_roles[role or "none"] == nil then
		return nil, "modify", "not-acceptable";
	end
	role = role ~= "none" and role or nil; -- coerces `role == false` to `nil`

	if actor == true then
		actor = nil -- So we can pass it safely to 'publicise_occupant_status' below
	else
		local actor_affiliation = self:get_affiliation(actor);

		-- Can't do anything to other owners or admins
		local occupant_affiliation = self:get_affiliation(occupant.bare_jid);
		if (occupant_affiliation == "owner" and actor_affiliation ~= "owner") or (occupant_affiliation == "admin" and actor_affiliation ~= "admin" and actor_affiliation ~= "owner") then
			return nil, "cancel", "not-allowed";
		end

		-- If you are trying to give or take moderator role you need to be an owner or admin
		if occupant.role == "moderator" or role == "moderator" then
			if actor_affiliation ~= "owner" and actor_affiliation ~= "admin" then
				return nil, "cancel", "not-allowed";
			end
		end

		-- Need to be in the room and a moderator
		local actor_occupant = self:get_occupant_by_real_jid(actor);
		if not actor_occupant or actor_occupant.role ~= "moderator" then
			return nil, "cancel", "not-allowed";
		end
	end

	local x = st.stanza("x", {xmlns = "http://jabber.org/protocol/muc#user"});
	if not role then
		x:tag("status", {code = "307"}):up();
	end
	occupant.role = role;
	self:save_occupant(occupant);
	self:publicise_occupant_status(occupant, x, nil, actor, reason);
	if role == nil then
		module:fire_event("muc-occupant-left", {room = self; nick = occupant.nick; occupant = occupant;});
	end
	return true;
end

local whois = module:require "muc/whois";
room_mt.get_whois = whois.get;
room_mt.set_whois = whois.set;

local _M = {}; -- module "muc"

function _M.new_room(jid, config)
	return setmetatable({
		jid = jid;
		_jid_nick = {};
		_occupants = {};
		_data = config or {};
		_affiliations = {};
		_affiliation_data = {};
	}, room_mt);
end

local new_format = module:get_option_boolean("new_muc_storage_format", false);

function room_mt:freeze(live)
	local frozen, state;
	if new_format then
		frozen = {
			_jid = self.jid;
			_data = self._data;
			_affiliation_data = self._affiliation_data;
		};
		for user, affiliation in pairs(self._affiliations) do
			frozen[user] = affiliation;
		end
	else
		frozen = {
			jid = self.jid;
			_data = self._data;
			_affiliations = self._affiliations;
			_affiliation_data = self._affiliation_data;
		};
	end
	if live then
		state = {};
		for nick, occupant in self:each_occupant() do
			state[nick] = {
				bare_jid = occupant.bare_jid;
				role = occupant.role;
				jid = occupant.jid;
			}
			for jid, presence in occupant:each_session() do
				state[jid] = st.preserialize(presence);
			end
		end
		local history = self._history;
		if history and history[1] ~= nil then
			state._last_message = st.preserialize(history[#history].stanza);
			state._last_message_at = history[#history].timestamp;
		end
	end
	return frozen, state;
end

function _M.restore_room(frozen, state)
	local room_jid = frozen._jid or frozen.jid;
	local room = _M.new_room(room_jid, frozen._data);

	if state and state._last_message and state._last_message_at then
		room._history = {
			{ stanza = st.deserialize(state._last_message),
			  timestamp = state._last_message_at, },
		};
	end

	local occupants = {};
	local room_name, room_host = jid_split(room_jid);

	room._affiliation_data = frozen._affiliation_data or {};

	if frozen.jid and frozen._affiliations then
		-- Old storage format
		room._affiliations = frozen._affiliations;
	else
		-- New storage format
		for jid, data in pairs(frozen) do
			local node, host, resource = jid_split(jid);
			if host:sub(1,1) ~= "_" and not resource and type(data) == "string" then
				-- bare jid: affiliation
				room._affiliations[jid] = data;
			end
		end
	end
	for jid, data in pairs(state or frozen) do
		local node, host, resource = jid_split(jid);
		if node or host:sub(1,1) ~= "_" then
			if host == room_host and node == room_name and resource and type(data) == "table" then
				-- full room jid: bare real jid and role
				local nick = jid;
				local occupant = occupants[nick] or occupant_lib.new(data.bare_jid, nick);
				occupant.bare_jid = data.bare_jid;
				occupant.role = data.role;
				occupant.jid = data.jid; -- Primary session JID
				occupants[nick] = occupant;
			elseif type(data) == "table" and data.name == "presence" then
				-- full user jid: presence
				local nick = data.attr.from;
				local occupant = occupants[nick] or occupant_lib.new(nil, nick);
				local presence = st.deserialize(data);
				occupant:set_session(jid, presence);
				occupants[nick] = occupant;
			end
		end
	end

	for _, occupant in pairs(occupants) do
		room:save_occupant(occupant);
	end

	return room;
end

_M.room_mt = room_mt;

return _M;
