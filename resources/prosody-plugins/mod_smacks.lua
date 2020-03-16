-- XEP-0198: Stream Management for Prosody IM
--
-- Copyright (C) 2010-2015 Matthew Wild
-- Copyright (C) 2010 Waqas Hussain
-- Copyright (C) 2012-2015 Kim Alvefur
-- Copyright (C) 2012 Thijs Alkemade
-- Copyright (C) 2014 Florian Zeitz
-- Copyright (C) 2016-2020 Thilo Molitor
--
-- This project is MIT/X11 licensed. Please see the
-- COPYING file in the source package for more information.
--

local st = require "util.stanza";
local dep = require "util.dependencies";
local cache = dep.softreq("util.cache");	-- only available in prosody 0.10+
local uuid_generate = require "util.uuid".generate;
local jid = require "util.jid";

local t_insert, t_remove = table.insert, table.remove;
local math_min = math.min;
local math_max = math.max;
local os_time = os.time;
local tonumber, tostring = tonumber, tostring;
local add_filter = require "util.filters".add_filter;
local timer = require "util.timer";
local datetime = require "util.datetime";

local xmlns_sm2 = "urn:xmpp:sm:2";
local xmlns_sm3 = "urn:xmpp:sm:3";
local xmlns_errors = "urn:ietf:params:xml:ns:xmpp-stanzas";
local xmlns_delay = "urn:xmpp:delay";

local sm2_attr = { xmlns = xmlns_sm2 };
local sm3_attr = { xmlns = xmlns_sm3 };

local resume_timeout = module:get_option_number("smacks_hibernation_time", 300);
local s2s_smacks = module:get_option_boolean("smacks_enabled_s2s", false);
local s2s_resend = module:get_option_boolean("smacks_s2s_resend", false);
local max_unacked_stanzas = module:get_option_number("smacks_max_unacked_stanzas", 0);
local delayed_ack_timeout = module:get_option_number("smacks_max_ack_delay", 60);
local max_hibernated_sessions = module:get_option_number("smacks_max_hibernated_sessions", 10);
local max_old_sessions = module:get_option_number("smacks_max_old_sessions", 10);
local core_process_stanza = prosody.core_process_stanza;
local sessionmanager = require"core.sessionmanager";

assert(max_hibernated_sessions > 0, "smacks_max_hibernated_sessions must be greater than 0");
assert(max_old_sessions > 0, "smacks_max_old_sessions must be greater than 0");

local c2s_sessions = module:shared("/*/c2s/sessions");

local function init_session_cache(max_entries, evict_callback)
	-- old prosody version < 0.10 (no limiting at all!)
	if not cache then
		local store = {};
		return {
			get = function(user, key)
				if not user then return nil; end
				if not key then return nil; end
				return store[key];
			end;
			set = function(user, key, value)
				if not user then return nil; end
				if not key then return nil; end
				store[key] = value;
			end;
		};
	end

	-- use per user limited cache for prosody >= 0.10
	local stores = {};
	return {
			get = function(user, key)
				if not user then return nil; end
				if not key then return nil; end
				if not stores[user] then
					stores[user] = cache.new(max_entries, evict_callback);
				end
				return stores[user]:get(key);
			end;
			set = function(user, key, value)
				if not user then return nil; end
				if not key then return nil; end
				if not stores[user] then stores[user] = cache.new(max_entries, evict_callback); end
				stores[user]:set(key, value);
				-- remove empty caches completely
				if not stores[user]:count() then stores[user] = nil; end
			end;
		};
end
local old_session_registry = init_session_cache(max_old_sessions, nil);
local session_registry = init_session_cache(max_hibernated_sessions, function(resumption_token, session)
	if session.destroyed then return true; end		-- destroyed session can always be removed from cache
	session.log("warn", "User has too much hibernated sessions, removing oldest session (token: %s)", resumption_token);
	-- store old session's h values on force delete
	-- save only actual h value and username/host (for security)
	old_session_registry.set(session.username, resumption_token, {
		h = session.handled_stanza_count,
		username = session.username,
		host = session.host
	});
	return true;	-- allow session to be removed from full cache to make room for new one
end);

local function stoppable_timer(delay, callback)
	local stopped = false;
	local timer = module:add_timer(delay, function (t)
		if stopped then return; end
		return callback(t);
	end);
	if timer and timer.stop then return timer; end		-- new prosody api includes stop() function
	return {
		stop = function(self) stopped = true end;
		timer;
	};
end

local function delayed_ack_function(session)
	-- fire event only if configured to do so and our session is not already hibernated or destroyed
	if delayed_ack_timeout > 0 and session.awaiting_ack
	and not session.hibernating and not session.destroyed then
		session.log("debug", "Firing event 'smacks-ack-delayed', queue = %d",
			session.outgoing_stanza_queue and #session.outgoing_stanza_queue or 0);
		module:fire_event("smacks-ack-delayed", {origin = session, queue = session.outgoing_stanza_queue});
	end
	session.delayed_ack_timer = nil;
end

local function can_do_smacks(session, advertise_only)
	if session.smacks then return false, "unexpected-request", "Stream management is already enabled"; end

	local session_type = session.type;
	if session.username then
		if not(advertise_only) and not(session.resource) then -- Fail unless we're only advertising sm
			return false, "unexpected-request", "Client must bind a resource before enabling stream management";
		end
		return true;
	elseif s2s_smacks and (session_type == "s2sin" or session_type == "s2sout") then
		return true;
	end
	return false, "service-unavailable", "Stream management is not available for this stream";
end

module:hook("stream-features",
		function (event)
			if can_do_smacks(event.origin, true) then
				event.features:tag("sm", sm2_attr):tag("optional"):up():up();
				event.features:tag("sm", sm3_attr):tag("optional"):up():up();
			end
		end);

module:hook("s2s-stream-features",
		function (event)
			if can_do_smacks(event.origin, true) then
				event.features:tag("sm", sm2_attr):tag("optional"):up():up();
				event.features:tag("sm", sm3_attr):tag("optional"):up():up();
			end
		end);

local function request_ack_if_needed(session, force, reason)
	local queue = session.outgoing_stanza_queue;
	local expected_h = session.last_acknowledged_stanza + #queue;
	-- session.log("debug", "*** SMACKS(1) ***: awaiting_ack=%s, hibernating=%s", tostring(session.awaiting_ack), tostring(session.hibernating));
	if session.awaiting_ack == nil and not session.hibernating then
		-- this check of last_requested_h prevents ack-loops if missbehaving clients report wrong
		-- stanza counts. it is set when an <r> is really sent (e.g. inside timer), preventing any
		-- further requests until a higher h-value would be expected.
		-- session.log("debug", "*** SMACKS(2) ***: #queue=%s, max_unacked_stanzas=%s, expected_h=%s, last_requested_h=%s", tostring(#queue), tostring(max_unacked_stanzas), tostring(expected_h), tostring(session.last_requested_h));
		if (#queue > max_unacked_stanzas and expected_h ~= session.last_requested_h) or force then
			session.log("debug", "Queuing <r> (in a moment) from %s - #queue=%d", reason, #queue);
			session.awaiting_ack = false;
			session.awaiting_ack_timer = stoppable_timer(1e-06, function ()
				-- session.log("debug", "*** SMACKS(3) ***: awaiting_ack=%s, hibernating=%s", tostring(session.awaiting_ack), tostring(session.hibernating));
				-- only request ack if needed and our session is not already hibernated or destroyed
				if not session.awaiting_ack and not session.hibernating and not session.destroyed then
					session.log("debug", "Sending <r> (inside timer, before send) from %s - #queue=%d", reason, #queue);
					(session.sends2s or session.send)(st.stanza("r", { xmlns = session.smacks }))
					session.awaiting_ack = true;
					-- expected_h could be lower than this expression e.g. more stanzas added to the queue meanwhile)
					session.last_requested_h = session.last_acknowledged_stanza + #queue;
					session.log("debug", "Sending <r> (inside timer, after send) from %s - #queue=%d", reason, #queue);
					if not session.delayed_ack_timer then
						session.delayed_ack_timer = stoppable_timer(delayed_ack_timeout, function()
							delayed_ack_function(session);
						end);
					end
				end
			end);
		end
	end

	-- Trigger "smacks-ack-delayed"-event if we added new (ackable) stanzas to the outgoing queue
	-- and there isn't already a timer for this event running.
	-- If we wouldn't do this, stanzas added to the queue after the first "smacks-ack-delayed"-event
	-- would not trigger this event (again).
	if #queue > max_unacked_stanzas and session.awaiting_ack and session.delayed_ack_timer == nil then
		session.log("debug", "Calling delayed_ack_function directly (still waiting for ack)");
		delayed_ack_function(session);
	end
end

local function outgoing_stanza_filter(stanza, session)
	local is_stanza = stanza.attr and not stanza.attr.xmlns and not stanza.name:find":";
	if is_stanza and not stanza._cached then -- Stanza in default stream namespace
		local queue = session.outgoing_stanza_queue;
		local cached_stanza = st.clone(stanza);
		cached_stanza._cached = true;

		if cached_stanza and cached_stanza.name ~= "iq" and cached_stanza:get_child("delay", xmlns_delay) == nil then
			cached_stanza = cached_stanza:tag("delay", {
				xmlns = xmlns_delay,
				from = jid.bare(session.full_jid or session.host),
				stamp = datetime.datetime()
			});
		end

		queue[#queue+1] = cached_stanza;
		if session.hibernating then
			session.log("debug", "hibernating, stanza queued");
			module:fire_event("smacks-hibernation-stanza-queued", {origin = session, queue = queue, stanza = cached_stanza});
			return nil;
		end
		request_ack_if_needed(session, false, "outgoing_stanza_filter");
	end
	return stanza;
end

local function count_incoming_stanzas(stanza, session)
	if not stanza.attr.xmlns then
		session.handled_stanza_count = session.handled_stanza_count + 1;
		session.log("debug", "Handled %d incoming stanzas", session.handled_stanza_count);
	end
	return stanza;
end

local function wrap_session_out(session, resume)
	if not resume then
		session.outgoing_stanza_queue = {};
		session.last_acknowledged_stanza = 0;
	end

	add_filter(session, "stanzas/out", outgoing_stanza_filter, -999);

	local session_close = session.close;
	function session.close(...)
		if session.resumption_token then
			session_registry.set(session.username, session.resumption_token, nil);
			old_session_registry.set(session.username, session.resumption_token, nil);
			session.resumption_token = nil;
		end
		-- send out last ack as per revision 1.5.2 of XEP-0198
		if session.smacks and session.conn then
			(session.sends2s or session.send)(st.stanza("a", { xmlns = session.smacks, h = string.format("%d", session.handled_stanza_count) }));
		end
		return session_close(...);
	end
	return session;
end

local function wrap_session_in(session, resume)
	if not resume then
		session.handled_stanza_count = 0;
	end
	add_filter(session, "stanzas/in", count_incoming_stanzas, 999);

	return session;
end

local function wrap_session(session, resume)
	wrap_session_out(session, resume);
	wrap_session_in(session, resume);
	return session;
end

function handle_enable(session, stanza, xmlns_sm)
	local ok, err, err_text = can_do_smacks(session);
	if not ok then
		session.log("warn", "Failed to enable smacks: %s", err_text); -- TODO: XEP doesn't say we can send error text, should it?
		(session.sends2s or session.send)(st.stanza("failed", { xmlns = xmlns_sm }):tag(err, { xmlns = xmlns_errors}));
		return true;
	end

	module:log("debug", "Enabling stream management");
	session.smacks = xmlns_sm;

	wrap_session(session, false);

	local resume_token;
	local resume = stanza.attr.resume;
	if resume == "true" or resume == "1" then
		resume_token = uuid_generate();
		session_registry.set(session.username, resume_token, session);
		session.resumption_token = resume_token;
	end
	(session.sends2s or session.send)(st.stanza("enabled", { xmlns = xmlns_sm, id = resume_token, resume = resume, max = tostring(resume_timeout) }));
	return true;
end
module:hook_stanza(xmlns_sm2, "enable", function (session, stanza) return handle_enable(session, stanza, xmlns_sm2); end, 100);
module:hook_stanza(xmlns_sm3, "enable", function (session, stanza) return handle_enable(session, stanza, xmlns_sm3); end, 100);

module:hook_stanza("http://etherx.jabber.org/streams", "features",
		function (session, stanza)
			stoppable_timer(1e-6, function ()
				if can_do_smacks(session) then
					if stanza:get_child("sm", xmlns_sm3) then
						session.sends2s(st.stanza("enable", sm3_attr));
						session.smacks = xmlns_sm3;
					elseif stanza:get_child("sm", xmlns_sm2) then
						session.sends2s(st.stanza("enable", sm2_attr));
						session.smacks = xmlns_sm2;
					else
						return;
					end
					wrap_session_out(session, false);
				end
			end);
		end);

function handle_enabled(session, stanza, xmlns_sm)
	module:log("debug", "Enabling stream management");
	session.smacks = xmlns_sm;

	wrap_session_in(session, false);

	-- FIXME Resume?

	return true;
end
module:hook_stanza(xmlns_sm2, "enabled", function (session, stanza) return handle_enabled(session, stanza, xmlns_sm2); end, 100);
module:hook_stanza(xmlns_sm3, "enabled", function (session, stanza) return handle_enabled(session, stanza, xmlns_sm3); end, 100);

function handle_r(origin, stanza, xmlns_sm)
	if not origin.smacks then
		module:log("debug", "Received ack request from non-smack-enabled session");
		return;
	end
	module:log("debug", "Received ack request, acking for %d", origin.handled_stanza_count);
	-- Reply with <a>
	(origin.sends2s or origin.send)(st.stanza("a", { xmlns = xmlns_sm, h = string.format("%d", origin.handled_stanza_count) }));
	-- piggyback our own ack request if needed (see request_ack_if_needed() for explanation of last_requested_h)
	local expected_h = origin.last_acknowledged_stanza + #origin.outgoing_stanza_queue;
	if #origin.outgoing_stanza_queue > 0 and expected_h ~= origin.last_requested_h then
		request_ack_if_needed(origin, true, "piggybacked by handle_r");
	end
	return true;
end
module:hook_stanza(xmlns_sm2, "r", function (origin, stanza) return handle_r(origin, stanza, xmlns_sm2); end);
module:hook_stanza(xmlns_sm3, "r", function (origin, stanza) return handle_r(origin, stanza, xmlns_sm3); end);

function handle_a(origin, stanza)
	if not origin.smacks then return; end
	origin.awaiting_ack = nil;
	if origin.awaiting_ack_timer then
		origin.awaiting_ack_timer:stop();
	end
	if origin.delayed_ack_timer then
		origin.delayed_ack_timer:stop();
		origin.delayed_ack_timer = nil;
	end
	-- Remove handled stanzas from outgoing_stanza_queue
	-- origin.log("debug", "ACK: h=%s, last=%s", stanza.attr.h or "", origin.last_acknowledged_stanza or "");
	local h = tonumber(stanza.attr.h);
	if not h then
		origin:close{ condition = "invalid-xml"; text = "Missing or invalid 'h' attribute"; };
		return;
	end
	local handled_stanza_count = h-origin.last_acknowledged_stanza;
	local queue = origin.outgoing_stanza_queue;
	if handled_stanza_count > #queue then
		origin.log("warn", "The client says it handled %d new stanzas, but we only sent %d :)",
			handled_stanza_count, #queue);
		origin.log("debug", "Client h: %d, our h: %d", tonumber(stanza.attr.h), origin.last_acknowledged_stanza);
		for i=1,#queue do
			origin.log("debug", "Q item %d: %s", i, tostring(queue[i]));
		end
	end

	for i=1,math_min(handled_stanza_count,#queue) do
		local handled_stanza = t_remove(origin.outgoing_stanza_queue, 1);
		module:fire_event("delivery/success", { session = origin, stanza = handled_stanza });
	end

	origin.log("debug", "#queue = %d", #queue);
	origin.last_acknowledged_stanza = origin.last_acknowledged_stanza + handled_stanza_count;
	request_ack_if_needed(origin, false, "handle_a")
	return true;
end
module:hook_stanza(xmlns_sm2, "a", handle_a);
module:hook_stanza(xmlns_sm3, "a", handle_a);

--TODO: Optimise... incoming stanzas should be handled by a per-session
-- function that has a counter as an upvalue (no table indexing for increments,
-- and won't slow non-198 sessions). We can also then remove the .handled flag
-- on stanzas

local function handle_unacked_stanzas(session)
	local queue = session.outgoing_stanza_queue;
	local error_attr = { type = "cancel" };
	if #queue > 0 then
		session.outgoing_stanza_queue = {};
		for i=1,#queue do
			if not module:fire_event("delivery/failure", { session = session, stanza = queue[i] }) then
				local reply = st.reply(queue[i]);
				if reply.attr.to ~= session.full_jid then
					reply.attr.type = "error";
					reply:tag("error", error_attr)
						:tag("recipient-unavailable", {xmlns = "urn:ietf:params:xml:ns:xmpp-stanzas"});
					core_process_stanza(session, reply);
				end
			end
		end
	end
end

-- don't send delivery errors for messages which will be delivered by mam later on
module:hook("delivery/failure", function(event)
	local session, stanza = event.session, event.stanza;
	-- Only deal with authenticated (c2s) sessions
	if session.username then
		if stanza.name == "message" and stanza.attr.xmlns == nil and
				( stanza.attr.type == "chat" or ( stanza.attr.type or "normal" ) == "normal" ) then
			-- do nothing here for normal messages and don't send out "message delivery errors",
			-- because messages are already in MAM at this point (no need to frighten users)
			if session.mam_requested and stanza._was_archived then
				return true;		-- stanza handled, don't send an error
			end
			-- store message in offline store, if this client does not use mam *and* was the last client online
			local sessions = prosody.hosts[module.host].sessions[session.username] and
					prosody.hosts[module.host].sessions[session.username].sessions or nil;
			if sessions and next(sessions) == session.resource and next(sessions, session.resource) == nil then
				module:fire_event("message/offline/handle", { origin = session, stanza = stanza } );
				return true;		-- stanza handled, don't send an error
			end
		end
	end
end);

-- mark stanzas as archived --> this will allow us to send back errors for stanzas not archived
-- because the user configured the server to do so ("no-archive"-setting for one special contact for example)
module:hook("archive-message-added", function(event)
	local session, stanza, for_user, stanza_id  = event.origin, event.stanza, event.for_user, event.id;
	if session then session.log("debug", "Marking stanza as archived, archive_id: %s, stanza: %s", tostring(stanza_id), tostring(stanza:top_tag())); end
	if not session then module:log("debug", "Marking stanza as archived in unknown session, archive_id: %s, stanza: %s", tostring(stanza_id), tostring(stanza:top_tag())); end
	stanza._was_archived = true;
end);

module:hook("pre-resource-unbind", function (event)
	local session, err = event.session, event.error;
	if session.smacks then
		if not session.resumption_token then
			local queue = session.outgoing_stanza_queue;
			if #queue > 0 then
				session.log("debug", "Destroying session with %d unacked stanzas", #queue);
				handle_unacked_stanzas(session);
			end
		else
			session.log("debug", "mod_smacks hibernating session for up to %d seconds", resume_timeout);
			local hibernate_time = os_time(); -- Track the time we went into hibernation
			session.hibernating = hibernate_time;
			local resumption_token = session.resumption_token;
			module:fire_event("smacks-hibernation-start", {origin = session, queue = session.outgoing_stanza_queue});
			timer.add_task(resume_timeout, function ()
				session.log("debug", "mod_smacks hibernation timeout reached...");
				-- We need to check the current resumption token for this resource
				-- matches the smacks session this timer is for in case it changed
				-- (for example, the client may have bound a new resource and
				-- started a new smacks session, or not be using smacks)
				local curr_session = full_sessions[session.full_jid];
				if session.destroyed then
					session.log("debug", "The session has already been destroyed");
				elseif curr_session and curr_session.resumption_token == resumption_token
				-- Check the hibernate time still matches what we think it is,
				-- otherwise the session resumed and re-hibernated.
				and session.hibernating == hibernate_time then
					-- wait longer if the timeout isn't reached because push was enabled for this session
					-- session.first_hibernated_push is the starting point for hibernation timeouts of those push enabled clients
					-- wait for an additional resume_timeout seconds if no push occured since hibernation at all
					local current_time = os_time();
					local timeout_start = math_max(session.hibernating, session.first_hibernated_push or session.hibernating);
					if session.push_identifier ~= nil and not session.first_hibernated_push then
						session.log("debug", "No push happened since hibernation started, hibernating session for up to %d extra seconds", resume_timeout);
						return resume_timeout;
					end
					if current_time-timeout_start < resume_timeout and session.push_identifier ~= nil then
						session.log("debug", "A push happened since hibernation started, hibernating session for up to %d extra seconds", current_time-timeout_start);
						return current_time-timeout_start;		-- time left to wait
					end
					session.log("debug", "Destroying session for hibernating too long");
					session_registry.set(session.username, session.resumption_token, nil);
					-- save only actual h value and username/host (for security)
					old_session_registry.set(session.username, session.resumption_token, {
						h = session.handled_stanza_count,
						username = session.username,
						host = session.host
					});
					session.resumption_token = nil;
					sessionmanager.destroy_session(session);
				else
					session.log("debug", "Session resumed before hibernation timeout, all is well")
				end
			end);
			return true; -- Postpone destruction for now
		end
	end
end);

local function handle_s2s_destroyed(event)
	local session = event.session;
	local queue = session.outgoing_stanza_queue;
	if queue and #queue > 0 then
		session.log("warn", "Destroying session with %d unacked stanzas", #queue);
		if s2s_resend then
			for i = 1, #queue do
				module:send(queue[i]);
			end
			session.outgoing_stanza_queue = nil;
		else
			handle_unacked_stanzas(session);
		end
	end
end

module:hook("s2sout-destroyed", handle_s2s_destroyed);
module:hook("s2sin-destroyed", handle_s2s_destroyed);

local function get_session_id(session)
	return session.id or (tostring(session):match("[a-f0-9]+$"));
end

function handle_resume(session, stanza, xmlns_sm)
	if session.full_jid then
		session.log("warn", "Tried to resume after resource binding");
		session.send(st.stanza("failed", { xmlns = xmlns_sm })
			:tag("unexpected-request", { xmlns = xmlns_errors })
		);
		return true;
	end

	local id = stanza.attr.previd;
	local original_session = session_registry.get(session.username, id);
	if not original_session then
		session.log("debug", "Tried to resume non-existent session with id %s", id);
		local old_session = old_session_registry.get(session.username, id);
		if old_session and session.username == old_session.username
		and session.host == old_session.host
		and old_session.h then
			session.send(st.stanza("failed", { xmlns = xmlns_sm, h = string.format("%d", old_session.h) })
				:tag("item-not-found", { xmlns = xmlns_errors })
			);
		else
			session.send(st.stanza("failed", { xmlns = xmlns_sm })
				:tag("item-not-found", { xmlns = xmlns_errors })
			);
		end;
	elseif session.username == original_session.username
	and session.host == original_session.host then
		session.log("debug", "mod_smacks resuming existing session %s...", get_session_id(original_session));
		original_session.log("debug", "mod_smacks session resumed from %s...", get_session_id(session));
		-- TODO: All this should move to sessionmanager (e.g. session:replace(new_session))
		if original_session.conn then
			original_session.log("debug", "mod_smacks closing an old connection for this session");
			local conn = original_session.conn;
			c2s_sessions[conn] = nil;
			conn:close();
		end
		local migrated_session_log = session.log;
		original_session.ip = session.ip;
		original_session.conn = session.conn;
		original_session.send = session.send;
		original_session.close = session.close;
		original_session.filter = session.filter;
		original_session.filter.session = original_session;
		original_session.filters = session.filters;
		original_session.stream = session.stream;
		original_session.secure = session.secure;
		original_session.hibernating = nil;
		session.log = original_session.log;
		session.type = original_session.type;
		wrap_session(original_session, true);
		-- Inform xmppstream of the new session (passed to its callbacks)
		original_session.stream:set_session(original_session);
		-- Similar for connlisteners
		c2s_sessions[session.conn] = original_session;

		original_session.send(st.stanza("resumed", { xmlns = xmlns_sm,
			h = string.format("%d", original_session.handled_stanza_count), previd = id }));

		-- Fake an <a> with the h of the <resume/> from the client
		original_session:dispatch_stanza(st.stanza("a", { xmlns = xmlns_sm,
			h = stanza.attr.h }));

		-- Ok, we need to re-send any stanzas that the client didn't see
		-- ...they are what is now left in the outgoing stanza queue
		-- We have to use the send of "session" because we don't want to add our resent stanzas
		-- to the outgoing queue again
		local queue = original_session.outgoing_stanza_queue;
		session.log("debug", "resending all unacked stanzas that are still queued after resume, #queue = %d", #queue);
		for i=1,#queue do
			session.send(queue[i]);
		end
		session.log("debug", "all stanzas resent, now disabling send() in this migrated session, #queue = %d", #queue);
		function session.send(stanza)
			migrated_session_log("error", "Tried to send stanza on old session migrated by smacks resume (maybe there is a bug?): %s", tostring(stanza));
			return false;
		end
		module:fire_event("smacks-hibernation-end", {origin = session, resumed = original_session, queue = queue});
		request_ack_if_needed(original_session, true, "handle_resume");
	else
		module:log("warn", "Client %s@%s[%s] tried to resume stream for %s@%s[%s]",
			session.username or "?", session.host or "?", session.type,
			original_session.username or "?", original_session.host or "?", original_session.type);
		session.send(st.stanza("failed", { xmlns = xmlns_sm })
			:tag("not-authorized", { xmlns = xmlns_errors }));
	end
	return true;
end
module:hook_stanza(xmlns_sm2, "resume", function (session, stanza) return handle_resume(session, stanza, xmlns_sm2); end);
module:hook_stanza(xmlns_sm3, "resume", function (session, stanza) return handle_resume(session, stanza, xmlns_sm3); end);

local function handle_read_timeout(event)
	local session = event.session;
	if session.smacks then
		if session.awaiting_ack then
			if session.awaiting_ack_timer then
				session.awaiting_ack_timer:stop();
			end
			if session.delayed_ack_timer then
				session.delayed_ack_timer:stop();
				session.delayed_ack_timer = nil;
			end
			return false; -- Kick the session
		end
		session.log("debug", "Sending <r> (read timeout)");
		(session.sends2s or session.send)(st.stanza("r", { xmlns = session.smacks }));
		session.awaiting_ack = true;
		if not session.delayed_ack_timer then
			session.delayed_ack_timer = stoppable_timer(delayed_ack_timeout, function()
				delayed_ack_function(session);
			end);
		end
		return true;
	end
end

module:hook("s2s-read-timeout", handle_read_timeout);
module:hook("c2s-read-timeout", handle_read_timeout);
