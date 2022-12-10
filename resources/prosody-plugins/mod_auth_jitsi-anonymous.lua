-- Anonymous authentication with extras:
-- * session resumption
-- Copyright (C) 2021-present 8x8, Inc.

local generate_random_id = require "util.id".medium;
local new_sasl = require "util.sasl".new;
local sasl = require "util.sasl";
local sessions = prosody.full_sessions;

-- define auth provider
local provider = {};

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
    -- Custom session matching so we can resume session even with randomly
    -- generated user IDs.
    local function get_username(self, message)
        if (session.previd ~= nil) then
            for _, session1 in pairs(sessions) do
                if (session1.resumption_token == session.previd) then
                    self.username = session1.username;
                    break;
                end
            end
        else
            self.username = message;
        end

        return true;
    end

    return new_sasl(module.host, { anonymous = get_username });
end

module:provides("auth", provider);

local function anonymous(self, message)
    -- Same as the vanilla anonymous auth plugin
    local username = generate_random_id():lower();

    -- This calls the handler created in 'provider.get_sasl_handler(session)'
    local result, err, msg = self.profile.anonymous(self, username, self.realm);

    if result == true then
        if (self.username == nil) then
            -- Session was not resumed
            self.username = username;
        end
        return "success";
    else
        return "failure", err, msg;
    end
end

sasl.registerMechanism("ANONYMOUS", {"anonymous"}, anonymous);
