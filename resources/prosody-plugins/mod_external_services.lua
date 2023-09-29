
local dt = require "util.datetime";
local base64 = require "util.encodings".base64;
local hashes = require "util.hashes";
local st = require "util.stanza";
local jid = require "util.jid";
local array = require "util.array";
local set = require "util.set";

local default_host = module:get_option_string("external_service_host", module.host);
local default_port = module:get_option_number("external_service_port");
local default_secret = module:get_option_string("external_service_secret");
local default_ttl = module:get_option_number("external_service_ttl", 86400);

local configured_services = module:get_option_array("external_services", {});

local access = module:get_option_set("external_service_access", {});

-- https://tools.ietf.org/html/draft-uberti-behave-turn-rest-00
local function behave_turn_rest_credentials(srv, item, secret)
	local ttl = default_ttl;
	if type(item.ttl) == "number" then
		ttl = item.ttl;
	end
	local expires = srv.expires or os.time() + ttl;
	local username;
	if type(item.username) == "string" then
		username = string.format("%d:%s", expires, item.username);
	else
		username = string.format("%d", expires);
	end
	srv.username = username;
	srv.password = base64.encode(hashes.hmac_sha1(secret, srv.username));
end

local algorithms = {
	turn = behave_turn_rest_credentials;
}

-- filter config into well-defined service records
local function prepare(item)
	if type(item) ~= "table" then
		module:log("error", "Service definition is not a table: %q", item);
		return nil;
	end

	local srv = {
		type = nil;
		transport = nil;
		host = default_host;
		port = default_port;
		username = nil;
		password = nil;
		restricted = nil;
		expires = nil;
	};

	if type(item.type) == "string" then
		srv.type = item.type;
	else
		module:log("error", "Service missing mandatory 'type' field: %q", item);
		return nil;
	end
	if type(item.transport) == "string" then
		srv.transport = item.transport;
	end
	if type(item.host) == "string" then
		srv.host = item.host;
	end
	if type(item.port) == "number" then
		srv.port = item.port;
	end
	if type(item.username) == "string" then
		srv.username = item.username;
	end
	if type(item.password) == "string" then
		srv.password = item.password;
		srv.restricted = true;
	end
	if item.restricted == true then
		srv.restricted = true;
	end
	if type(item.expires) == "number" then
		srv.expires = item.expires;
	elseif type(item.ttl) == "number" then
		srv.expires = os.time() + item.ttl;
	end
	if (item.secret == true and default_secret) or type(item.secret) == "string" then
		local secret_cb = item.credentials_cb or algorithms[item.algorithm] or algorithms[srv.type];
		local secret = item.secret;
		if secret == true then
			secret = default_secret;
		end
		if secret_cb then
			secret_cb(srv, item, secret);
			srv.restricted = true;
		end
	end
	return srv;
end

function module.load()
	-- Trigger errors on startup
	local services = configured_services / prepare;
	if #services == 0 then
		module:log("warn", "No services configured or all had errors");
	end
end

-- Ensure only valid items are added in events
local services_mt = {
	__index = getmetatable(array()).__index;
	__newindex = function (self, i, v)
		rawset(self, i, assert(prepare(v), "Invalid service entry added"));
	end;
}

function get_services()
	local extras = module:get_host_items("external_service");
	local services = ( configured_services + extras ) / prepare;

	setmetatable(services, services_mt);

	return services;
end

function services_xml(services, name, namespace)
	local reply = st.stanza(name or "services", { xmlns = namespace or "urn:xmpp:extdisco:2" });

	for _, srv in ipairs(services) do
		reply:tag("service", {
				type = srv.type;
				transport = srv.transport;
				host = srv.host;
				port = srv.port and string.format("%d", srv.port) or nil;
				username = srv.username;
				password = srv.password;
				expires = srv.expires and dt.datetime(srv.expires) or nil;
				restricted = srv.restricted and "1" or nil;
			}):up();
	end

	return reply;
end

local function handle_services(event)
	local origin, stanza = event.origin, event.stanza;
	local action = stanza.tags[1];

	local user_bare = jid.bare(stanza.attr.from);
	local user_host = jid.host(user_bare);
	if not ((access:empty() and origin.type == "c2s") or access:contains(user_bare) or access:contains(user_host)) then
		origin.send(st.error_reply(stanza, "auth", "forbidden"));
		return true;
	end

	local services = get_services();

	local requested_type = action.attr.type;
	if requested_type then
		services:filter(function(item)
			return item.type == requested_type;
		end);
	end

	module:fire_event("external_service/services", {
			origin = origin;
			stanza = stanza;
			requested_type = requested_type;
			services = services;
		});

	local reply = st.reply(stanza):add_child(services_xml(services, action.name, action.attr.xmlns));

	origin.send(reply);
	return true;
end

local function handle_credentials(event)
	local origin, stanza = event.origin, event.stanza;
	local action = stanza.tags[1];

	if origin.type ~= "c2s" then
		origin.send(st.error_reply(stanza, "auth", "forbidden", "The 'port' and 'type' attributes are required."));
		return true;
	end

	local services = get_services();
	services:filter(function (item)
		return item.restricted;
	end)

	local requested_credentials = set.new();
	for service in action:childtags("service") do
		if not service.attr.type or not service.attr.host then
			origin.send(st.error_reply(stanza, "modify", "bad-request"));
			return true;
		end

		requested_credentials:add(string.format("%s:%s:%d", service.attr.type, service.attr.host,
			tonumber(service.attr.port) or 0));
	end

	module:fire_event("external_service/credentials", {
			origin = origin;
			stanza = stanza;
			requested_credentials = requested_credentials;
			services = services;
		});

	services:filter(function (srv)
		local port_key = string.format("%s:%s:%d", srv.type, srv.host, srv.port or 0);
		local portless_key = string.format("%s:%s:%d", srv.type, srv.host, 0);
		return requested_credentials:contains(port_key) or requested_credentials:contains(portless_key);
	end);

	local reply = st.reply(stanza):add_child(services_xml(services, action.name, action.attr.xmlns));

	origin.send(reply);
	return true;
end

-- XEP-0215 v0.7
module:add_feature("urn:xmpp:extdisco:2");
module:hook("iq-get/host/urn:xmpp:extdisco:2:services", handle_services);
module:hook("iq-get/host/urn:xmpp:extdisco:2:credentials", handle_credentials);

-- COMPAT XEP-0215 v0.6
-- Those still on the old version gets to deal with undefined attributes until they upgrade.
module:add_feature("urn:xmpp:extdisco:1");
module:hook("iq-get/host/urn:xmpp:extdisco:1:services", handle_services);
module:hook("iq-get/host/urn:xmpp:extdisco:1:credentials", handle_credentials);
