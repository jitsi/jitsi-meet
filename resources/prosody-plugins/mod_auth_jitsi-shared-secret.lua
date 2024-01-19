-- Authentication with shared secret where the username is ignored
-- Copyright (C) 2023-present 8x8, Inc.

local new_sasl = require "util.sasl".new;
local saslprep = require "util.encodings".stringprep.saslprep;
local secure_equals = require "util.hashes".equals;

local shared_secret = module:get_option_string('shared_secret');
if shared_secret == nil then
    module:log('error', 'No shared_secret specified. No secret to operate on!');
    return;
end

module:depends("jitsi_session");

-- define auth provider
local provider = {};

function provider.test_password(username, password)
    password = saslprep(password);
    if not password then
        return nil, "Password fails SASLprep.";
    end

    if secure_equals(password, saslprep(shared_secret)) then
        return true;
    else
        return nil, "Auth failed. Invalid username or password.";
    end
end

function provider.get_password(username)
    return shared_secret;
end

function provider.set_password(username, password)
    return nil, "Set password not supported";
end

function provider.user_exists(username)
    return true; -- all usernames exist
end

function provider.create_user(username, password)
    return nil;
end

function provider.delete_user(username)
    return nil;
end

function provider.get_sasl_handler(session)
	local getpass_authentication_profile = {
		plain = function(_, username, realm)
			return shared_secret, true;
		end
	};
	return new_sasl(module.host, getpass_authentication_profile);
end

module:provides("auth", provider);
