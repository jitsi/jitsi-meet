-- Using as a base version https://hg.prosody.im/prosody-modules/file/c1a8ce147885/mod_s2s_whitelist/mod_s2s_whitelist.lua
local st = require "util.stanza";

local whitelist = module:get_option_inherited_set("s2s_whitelist", {});

module:hook("route/remote", function (event)
	if not whitelist:contains(event.to_host) then
	    -- make sure we do not send error replies for errors
        if event.stanza.attr.type == 'error' then
            module:log('debug', 'Not whitelisted destination domain for an error: %s', event.stanza);
            return true;
        end

		module:send(st.error_reply(event.stanza, "cancel", "not-allowed", "Communication with this domain is restricted"));
		return true;
	end
end, 100);

module:hook("s2s-stream-features", function (event)
	if not whitelist:contains(event.origin.from_host) then
		event.origin:close({
			condition = "policy-violation";
			text = "Communication with this domain is restricted";
		});
	end
end, 1000);
