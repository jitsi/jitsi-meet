-- Token authentication
-- Copyright (C) 2021-present 8x8, Inc.

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

module:depends("jitsi_session");

local measure_pre_fetch_fail = module:measure('pre_fetch_fail', 'counter');
local measure_verify_fail = module:measure('verify_fail', 'counter');
local measure_success = module:measure('success', 'counter');
local measure_ban = module:measure('ban', 'counter');
local measure_post_auth_fail = module:measure('post_auth_fail', 'counter');

-- define auth provider
local provider = {};

local host = module.host;

module:hook("pre-resource-unbind", function (e)
    local error, session = e.error, e.session;

    prosody.events.fire_event('jitsi-pre-session-unbind', {
        jid = session.full_jid,
        session = session,
        error = error
    });
end, 11);

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

function first_stage_auth(session)
    -- retrieve custom public key from server and save it on the session
    local pre_event_result = prosody.events.fire_event("pre-jitsi-authentication-fetch-key", session);
    if pre_event_result ~= nil and pre_event_result.res == false then
        module:log("warn",
            "Error verifying token on pre authentication stage:%s, reason:%s", pre_event_result.error, pre_event_result.reason);
        session.auth_token = nil;
        measure_pre_fetch_fail(1);
        return  pre_event_result;
    end

    local res, error, reason = token_util:process_and_verify_token(session);
    if res == false then
        module:log("warn",
            "Error verifying token err:%s, reason:%s tenant:%s room:%s user_agent:%s",
                error, reason, session.jitsi_web_query_prefix, session.jitsi_web_query_room,
                session.user_agent_header);
        session.auth_token = nil;
        measure_verify_fail(1);
        return  { res = res, error = error, reason = reason };
    end

    local shouldAllow = prosody.events.fire_event("jitsi-access-ban-check", session);
    if shouldAllow == false then
        module:log("warn", "user is banned")
        measure_ban(1);
        return  { res = false, error = "not-allowed", reason = "user is banned" };
    end

    return { verify_result = res, custom_username = prosody.events.fire_event("pre-jitsi-authentication", session) };
end

function second_stage_auth(session)
    local post_event_result = prosody.events.fire_event("post-jitsi-authentication", session);
    if post_event_result ~= nil and post_event_result.res == false then
        module:log("warn",
            "Error verifying token on post authentication stage :%s, reason:%s", post_event_result.error, post_event_result.reason);
        session.auth_token = nil;
        measure_post_auth_fail(1);
        return post_event_result;
    end
end

function provider.get_sasl_handler(session)

    local function get_username_from_token(self, message)

        local s1_result = first_stage_auth(session);
        if s1_result.res == false then
            return s1_result.res, s1_result.error, s1_result.reason;
        end

        if s1_result.custom_username then
            self.username = s1_result.custom_username;
        elseif session.previd ~= nil then
            for _, session1 in pairs(sessions) do
                if (session1.resumption_token == session.previd) then
                    self.username = session1.username;
                    break;
                end
            end
        else
            self.username = message;
        end

        local s2_result = second_stage_auth(session);
        if s2_result and s2_result.res ~= nil then
            return s2_result.res, s2_result.error, s2_result.reason;
        end

        measure_success(1);
        session._jitsi_auth_done = true;
        return s1_result.verify_result;
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

module:hook_global('c2s-session-updated', function (event)
    local session, from_session = event.session, event.from_session;

    if not from_session.auth_token then
        return;
    end

    -- we care to handle sessions from other hosts (anonymous hosts)
    if module.host ~= event.from_session.host then
        -- Handle session updates (e.g., when a session is resumed on some anonymous host with a token we need to do all the checks here)
        session.auth_token = event.from_session.auth_token;

        local s1_result = first_stage_auth(session);
        if s1_result.res == false then
            event.session:close();
            return;
        end

        local s2_result = second_stage_auth(session);
        if s2_result and s2_result.res == false then
            event.session:close();
            return;
        end
        session._jitsi_auth_done = true;
    end

    if not session._jitsi_auth_done then
        module:log('warn', 'Impossible case hit where session did not pass auth flow');
        event.session:close();
        return;
    end

    -- copy all the custom fields we set in the session
    session.auth_token = from_session.auth_token;
    session.jitsi_meet_context_user = from_session.jitsi_meet_context_user;
    session.jitsi_meet_context_group = from_session.jitsi_meet_context_group;
    session.jitsi_meet_context_features = from_session.jitsi_meet_context_features;
    session.jitsi_meet_context_room = from_session.jitsi_meet_context_room;
    session.jitsi_meet_room = from_session.jitsi_meet_room;
    session.jitsi_meet_str_tenant = from_session.jitsi_meet_str_tenant;
    session.jitsi_meet_domain = from_session.jitsi_meet_domain;
    session.jitsi_meet_tenant_mismatch = from_session.jitsi_meet_tenant_mismatch;
end, 1);
