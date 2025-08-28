-----------------------------------------------------------
-- mod_roster_command: Manage rosters through prosodyctl
-- version 0.02
-----------------------------------------------------------
-- Copyright (C) 2011 Matthew Wild
-- Copyright (C) 2011 Adam Nielsen
--
-- This project is MIT/X11 licensed. Please see the
-- COPYING file in the source package for more information.
-----------------------------------------------------------

if module.host ~= "*" then
	module:log("error", "Do not load this module in Prosody, for correct usage see: https://modules.prosody.im/mod_roster_command.html");
	return;
end


-- Workaround for lack of util.startup...
local prosody = _G.prosody;
local hosts = prosody.hosts;
prosody.bare_sessions = prosody.bare_sessions or {};
_G.bare_sessions = _G.bare_sessions or prosody.bare_sessions;

local usermanager = require "core.usermanager";
local rostermanager = require "core.rostermanager";
local storagemanager = require "core.storagemanager";
local jid = require "util.jid";
local warn = require"util.prosodyctl".show_warning;

-- Make a *one-way* subscription. User will see when contact is online,
-- contact will not see when user is online.
function subscribe(user_jid, contact_jid)
	local user_username, user_host = jid.split(user_jid);
	local contact_username, contact_host = jid.split(contact_jid);
	if not hosts[user_host] then
		warn("The host '%s' is not configured for this server.", user_host);
		return;
	end
	if hosts[user_host].users.name == "null" then
		storagemanager.initialize_host(user_host);
		usermanager.initialize_host(user_host);
	end
	-- Update user's roster to say subscription request is pending. Bare hosts (e.g. components) don't have rosters.
    if user_username ~= nil then
	    rostermanager.set_contact_pending_out(user_username, user_host, contact_jid);
    end
	if hosts[contact_host] then
		if contact_host ~= user_host and hosts[contact_host].users.name == "null" then
			storagemanager.initialize_host(contact_host);
			usermanager.initialize_host(contact_host);
		end
		-- Update contact's roster to say subscription request is pending...
		rostermanager.set_contact_pending_in(contact_username, contact_host, user_jid);
		-- Update contact's roster to say subscription request approved...
		rostermanager.subscribed(contact_username, contact_host, user_jid);
		-- Update user's roster to say subscription request approved. Bare hosts (e.g. components) don't have rosters.
        if user_username ~= nil then
		    rostermanager.process_inbound_subscription_approval(user_username, user_host, contact_jid);
        end
	end
end

-- Make a mutual subscription between jid1 and jid2. Each JID will see
-- when the other one is online.
function subscribe_both(jid1, jid2)
	subscribe(jid1, jid2);
	subscribe(jid2, jid1);
end

-- Unsubscribes user from contact (not contact from user, if subscribed).
function unsubscribe(user_jid, contact_jid)
	local user_username, user_host = jid.split(user_jid);
	local contact_username, contact_host = jid.split(contact_jid);
	if not hosts[user_host] then
		warn("The host '%s' is not configured for this server.", user_host);
		return;
	end
	if hosts[user_host].users.name == "null" then
		storagemanager.initialize_host(user_host);
		usermanager.initialize_host(user_host);
	end
	-- Update user's roster to say subscription is cancelled...
	rostermanager.unsubscribe(user_username, user_host, contact_jid);
	if hosts[contact_host] then
		if contact_host ~= user_host and hosts[contact_host].users.name == "null" then
			storagemanager.initialize_host(contact_host);
			usermanager.initialize_host(contact_host);
		end
		-- Update contact's roster to say subscription is cancelled...
		rostermanager.unsubscribed(contact_username, contact_host, user_jid);
	end
end

-- Cancel any subscription in either direction.
function unsubscribe_both(jid1, jid2)
	unsubscribe(jid1, jid2);
	unsubscribe(jid2, jid1);
end

-- Set the name shown and group used in the contact list
function rename(user_jid, contact_jid, contact_nick, contact_group)
	local user_username, user_host = jid.split(user_jid);
	if not hosts[user_host] then
		warn("The host '%s' is not configured for this server.", user_host);
		return;
	end
	if hosts[user_host].users.name == "null" then
		storagemanager.initialize_host(user_host);
		usermanager.initialize_host(user_host);
	end

	-- Load user's roster and find the contact
	local roster = rostermanager.load_roster(user_username, user_host);
	local item = roster[contact_jid];
	if item then
		if contact_nick then
			item.name = contact_nick;
		end
		if contact_group then
			item.groups = {}; -- Remove from all current groups
			item.groups[contact_group] = true;
		end
		rostermanager.save_roster(user_username, user_host, roster);
	end
end

function remove(user_jid, contact_jid)
	unsubscribe_both(user_jid, contact_jid);
	local user_username, user_host = jid.split(user_jid);
	local roster = rostermanager.load_roster(user_username, user_host);
	roster[contact_jid] = nil;
	rostermanager.save_roster(user_username, user_host, roster);
end

function module.command(arg)
	local command = arg[1];
	if not command then
		warn("Valid subcommands: (un)subscribe(_both) | rename");
		return 0;
	end
	table.remove(arg, 1);
	if command == "subscribe" then
		subscribe(arg[1], arg[2]);
		return 0;
	elseif command == "subscribe_both" then
		subscribe_both(arg[1], arg[2]);
		return 0;
	elseif command == "unsubscribe" then
		unsubscribe(arg[1], arg[2]);
		return 0;
	elseif command == "unsubscribe_both" then
		unsubscribe_both(arg[1], arg[2]);
		return 0;
	elseif command == "remove" then
		remove(arg[1], arg[2]);
		return 0;
	elseif command == "rename" then
		rename(arg[1], arg[2], arg[3], arg[4]);
		return 0;
	else
		warn("Unknown command: %s", command);
		return 1;
	end
end
