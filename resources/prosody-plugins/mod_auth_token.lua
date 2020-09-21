-- Token authentication
-- Copyright (C) 2015 Atlassian

local formdecode = require "util.http".formdecode;
local generate_uuid = require "util.uuid".generate;
local new_sasl = require "util.sasl".new;
local sasl = require "util.sasl";
local token_util = module:require "token/util".new(module);
local sessions = prosody.full_sessions;

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

        -- The following fields are filled in the session, by extracting them
        -- from the query and no validation is beeing done.
        -- After validating auth_token will be cleaned in case of error and few
        -- other fields will be extracted from the token and set in the session

        session.auth_token = query and params.token or nil;
        -- previd is used together with https://modules.prosody.im/mod_smacks.html
        -- the param is used to find resumed session and re-use anonymous(random) user id
        -- (see get_username_from_token)
        session.previd = query and params.previd or nil;

        -- The room name and optional prefix from the web query
        session.jitsi_web_query_room = params.room;
        session.jitsi_web_query_prefix = params.prefix or "";

        -- Deprecated, you should use jitsi_web_query_room and jitsi_web_query_prefix
        session.jitsi_bosh_query_room = session.jitsi_web_query_room;
        session.jitsi_bosh_query_prefix = session.jitsi_web_query_prefix;
    end
end

module:hook_global("bosh-session", init_session);
module:hook_global("websocket-session", init_session);

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

        -- retrieve custom public key from server and save it on the session
        local pre_event_result = prosody.events.fire_event("pre-jitsi-authentication-fetch-key", session);
        if pre_event_result ~= nil and pre_event_result.res == false then
            log("warn",
                "Error verifying token on pre authentication stage:%s, reason:%s", pre_event_result.error, pre_event_result.reason);
            session.auth_token = nil;
            return pre_event_result.res, pre_event_result.error, pre_event_result.reason;
        end

        local res, error, reason = token_util:process_and_verify_token(session);
        if res == false then
            log("warn",
                "Error verifying token err:%s, reason:%s", error, reason);
            session.auth_token = nil;
            return res, error, reason;
        end

        local customUsername
            = prosody.events.fire_event("pre-jitsi-authentication", session);

        if (customUsername) then
            self.username = customUsername;
        elseif (session.previd ~= nil) then
            for _, session1 in pairs(sessions) do
                if (session1.resumption_token == session.previd) then
                    self.username = session1.username;
                    break;
                end
        	end
        else
            self.username = message;
        end

        local post_event_result = prosody.events.fire_event("post-jitsi-authentication", session);
        if post_event_result ~= nil and post_event_result.res == false then
            log("warn",
                "Error verifying token on post authentication stage :%s, reason:%s", post_event_result.error, post_event_result.reason);
            session.auth_token = nil;
            return post_event_result.res, post_event_result.error, post_event_result.reason;
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
		if (self.username == nil) then
			self.username = username;
		end
		return "success";
	else
		return "failure", err, msg;
	end
end

sasl.registerMechanism("ANONYMOUS", {"anonymous"}, anonymous);
