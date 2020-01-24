-- Token authentication
-- Copyright (C) 2015 Atlassian

local formdecode = require "util.http".formdecode;
local generate_uuid = require "util.uuid".generate;
local new_sasl = require "util.sasl".new;
local sasl = require "util.sasl";
local token_util = module:require "token/util".new(module);

-- no token configuration
if token_util == nil then
    return;
end

-- define auth provider
local provider = {};

local host = module.host;

-- Extract 'token' param from URL when session is created
function init_session(event)
	local session, request = event.session, event.request;
	local query = request.url.query;

	if query ~= nil then
        local params = formdecode(query);
        session.auth_token = query and params.token or nil;

        -- The room name and optional prefix from the bosh query
        session.jitsi_bosh_query_room = params.room;
        session.jitsi_bosh_query_prefix = params.prefix or "";
    end
end

module:hook("bosh-session", init_session);
module:hook("websocket-session", init_session);

function provider.test_password(username, password)
	return nil, "Password based auth not supported";
end

function provider.get_password(username)
	return nil;
end

function provider.set_password(username, password)
	return nil, "Set password not supported";
end

function provider.user_exists(username)
	return nil;
end

function provider.create_user(username, password)
	return nil;
end

function provider.delete_user(username)
	return nil;
end

function provider.get_sasl_handler(session)

	local function get_username_from_token(self, message)
        local res, error, reason = token_util:process_and_verify_token(session);

        if (res == false) then
            log("warn",
                "Error verifying token err:%s, reason:%s", error, reason);
            return res, error, reason;
        end

        local customUsername
            = prosody.events.fire_event("pre-jitsi-authentication", session);

        if (customUsername) then
            self.username = customUsername;
        else
            self.username = message;
        end

        return res;
	end

	return new_sasl(host, { anonymous = get_username_from_token });
end

module:provides("auth", provider);

local function anonymous(self, message)

	local username = generate_uuid();

	-- This calls the handler created in 'provider.get_sasl_handler(session)'
	local result, err, msg = self.profile.anonymous(self, username, self.realm);

	if result == true then
		return "success";
	else

		return "failure", err, msg;
	end
end

sasl.registerMechanism("ANONYMOUS", {"anonymous"}, anonymous);
