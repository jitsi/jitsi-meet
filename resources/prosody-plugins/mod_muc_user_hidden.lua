--This module adds is_hidden tag when jwt contains `hidden`
--flag set to true, or removes it in case it was
--added maliciously from client sent presence.
--The module must be enabled under the main virtual host.
local util = module:require 'util';
local is_user_hidden = util.is_user_hidden;
local process_host_module = util.process_host_module;

local TAG_NAME = 'is_hidden'
local USER_HIDDEN_FEATURE = 'http://jitsi.org/protocol/user_hidden';

-- main_muc
local main_muc_component_config = module:get_option_string('main_muc');
if main_muc_component_config == nil then
    module:log('error', 'hidden_user not enabled missing main_muc config');
    return ;
end

-- breakout_rooms_muc
local breakout_rooms_muc_component_config = module:get_option_string('breakout_rooms_muc');

function add_hidden_tag(event)
    local stanza = event.stanza;

    if stanza == nil or stanza.name ~= 'presence' then
      return
    end

    stanza:maptags(function(tag)
      if tag and tag.name == TAG_NAME then
          module:log('info', 'Removing %s tag from presence stanza!', TAG_NAME);
          return nil;
      else
          return tag;
      end
    end)

    local session = event.origin;

    if is_user_hidden(session) then
        stanza:tag(TAG_NAME):up()
    end
end

function process_muc_component(host)
    module:log("info", "Hook to presence on %s", host);

    local muc_module = module:context(host);
    muc_module:hook('presence/bare', add_hidden_tag);
    muc_module:hook('presence/full', add_hidden_tag);
    muc_module:hook('presence/host', add_hidden_tag);

    -- announce it to the client
    muc_module:hook('muc-disco#info', function(event)
        event.reply:tag('feature', { var = USER_HIDDEN_FEATURE }):up();
    end);
end

process_host_module(main_muc_component_config, process_muc_component);

if breakout_rooms_muc_component_config then
    process_host_module(breakout_rooms_muc_component_config, process_muc_component);
end

module:log('info', 'Loaded mod_muc_user_hidden!');
