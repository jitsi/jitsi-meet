if module:get_host_type() ~= "component" then
	error("proxy_component should be loaded as component", 0);
end

local jid_split = require "util.jid".split;
local jid_bare = require "util.jid".bare;
local jid_prep = require "util.jid".prep;
local st = require "util.stanza";
local array = require "util.array";

local target_address = module:get_option_string("target_address");

sessions = array{};
local sessions = sessions;

local function handle_target_presence(stanza)
	local type = stanza.attr.type;
	module:log("debug", "received presence from destination: %s", type)
	local _, _, resource = jid_split(stanza.attr.from);
	if type == "error" then
		-- drop all known sessions
		for k in pairs(sessions) do
			sessions[k] = nil
		end
		module:log(
			"debug",
			"received error presence, dropping all target sessions",
			resource
		)
	elseif type == "unavailable" then
		for k in pairs(sessions) do
			if sessions[k] == resource then
				sessions[k] = nil
				module:log(
					"debug",
					"dropped target session: %s",
					resource
				)
				break
			end
		end
	elseif not type then
		-- available
		local found = false;
		for k in pairs(sessions) do
			if sessions[k] == resource then
				found = true;
				break
			end
		end
		if not found then
			module:log(
				"debug",
				"registered new target session: %s",
				resource
			)
			sessions:push(resource)
		end
	end
end

local function handle_from_target(stanza)
	local type = stanza.attr.type
	module:log(
		"debug",
		"non-presence stanza from target: name = %s, type = %s",
		stanza.name,
		type
	)
	if stanza.name == "iq" then
		if type == "error" or type == "result" then
			-- de-NAT message
			local _, _, denatted_to_unprepped = jid_split(stanza.attr.to);
			local denatted_to = jid_prep(denatted_to_unprepped);
			if not denatted_to then
				module:log(
					"debug",
					"cannot de-NAT stanza, invalid to: %s",
					denatted_to_unprepped
				)
				return
			end
			local denatted_from = module:get_host();

			module:log(
				"debug",
				"de-NAT-ed stanza: from: %s -> %s, to: %s -> %s",
				stanza.attr.from,
				denatted_from,
				stanza.attr.to,
				denatted_to
			)

			stanza.attr.from = denatted_from
			stanza.attr.to = denatted_to

			module:send(stanza)
		else
			-- FIXME: we don’t support NATing outbund requests atm.
			module:send(st.error_reply(stanza, "cancel", "feature-not-implemented"))
		end
	elseif stanza.name == "message" then
		-- not implemented yet, we need a way to ensure that routing doesn’t
		-- break
		module:send(st.error_reply(stanza, "cancel", "feature-not-implemented"))
	end
end

local function handle_to_target(stanza)
	local type = stanza.attr.type;
	module:log(
		"debug",
		"stanza to target: name = %s, type = %s",
		stanza.name, type
	)
	if stanza.name == "presence" then
		if type ~= "error" then
			module:send(st.error_reply(stanza, "cancel", "bad-request"))
			return
		end
	elseif stanza.name == "iq" then
		if type == "get" or type == "set" then
			if #sessions == 0 then
				-- no sessions available to send to
				module:log("debug", "no sessions to send to!")
				module:send(st.error_reply(stanza, "cancel", "service-unavailable"))
				return
			end

			-- find a target session
			local target_session = sessions:random()
			local target = target_address .. "/" .. target_session

			-- encode sender JID in resource
			local natted_from = module:get_host() .. "/" .. stanza.attr.from;

			module:log(
				"debug",
				"NAT-ed stanza: from: %s -> %s, to: %s -> %s",
				stanza.attr.from,
				natted_from,
				stanza.attr.to,
				target
			)

			stanza.attr.from = natted_from
			stanza.attr.to = target

			module:send(stanza)
		end
		-- FIXME: handle and forward result/error correctly
	elseif stanza.name == "message" then
		-- not implemented yet, we need a way to ensure that routing doesn’t
		-- break
		module:send(st.error_reply(stanza, "cancel", "feature-not-implemented"))
	end
end

local function stanza_handler(event)
	local origin, stanza = event.origin, event.stanza
	module:log("debug", "received stanza from %s session", origin.type)

	local bare_from = jid_bare(stanza.attr.from);
	local _, _, to = jid_split(stanza.attr.to);
	if bare_from == target_address then
		-- from our target, to whom?
		if not to then
			-- directly to component
			if stanza.name == "presence" then
				handle_target_presence(stanza)
			else
				module:send(st.error_reply(stanza, "cancel", "bad-request"))
				return true
			end
		else
			-- to someone else
			handle_from_target(stanza)
		end
	else
		handle_to_target(stanza)
	end
	return true
end

module:hook("iq/bare", stanza_handler, -1);
module:hook("message/bare", stanza_handler, -1);
module:hook("presence/bare", stanza_handler, -1);
module:hook("iq/full", stanza_handler, -1);
module:hook("message/full", stanza_handler, -1);
module:hook("presence/full", stanza_handler, -1);
module:hook("iq/host", stanza_handler, -1);
module:hook("message/host", stanza_handler, -1);
module:hook("presence/host", stanza_handler, -1);

module:log("debug", "loaded proxy on %s", module:get_host())

subscription_request = st.presence({
	type = "subscribe",
	to = target_address,
	from = module:get_host()}
)
module:send(subscription_request)
