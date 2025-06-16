--luacheck: globals meta idsafe
local condition_handlers = {};

local jid = require "util.jid";
local unpack = table.unpack or unpack;

-- Helper to convert user-input strings (yes/true//no/false) to a bool
local function string_to_boolean(s)
	s = s:lower();
	return s == "yes" or s == "true";
end

-- Return a code string for a condition that checks whether the contents
-- of variable with the name 'name' matches any of the values in the
-- comma/space/pipe delimited list 'values'.
local function compile_comparison_list(name, values)
	local conditions = {};
	for value in values:gmatch("[^%s,|]+") do
		table.insert(conditions, ("%s == %q"):format(name, value));
	end
	return table.concat(conditions, " or ");
end

function condition_handlers.KIND(kind)
	assert(kind, "Expected stanza kind to match against");
	return compile_comparison_list("name", kind), { "name" };
end

local wildcard_equivs = { ["*"] = ".*", ["?"] = "." };

local function compile_jid_match_part(part, match)
	if not match then
		return part.." == nil";
	end
	local pattern = match:match("^<(.*)>$");
	if pattern then
		if pattern == "*" then
			return part;
		end
		if pattern:find("^<.*>$") then
			pattern = pattern:match("^<(.*)>$");
		else
			pattern = pattern:gsub("%p", "%%%0"):gsub("%%(%p)", wildcard_equivs);
		end
		return ("(%s and %s:find(%q))"):format(part, part, "^"..pattern.."$");
	else
		return ("%s == %q"):format(part, match);
	end
end

local function compile_jid_match(which, match_jid)
	local match_node, match_host, match_resource = jid.split(match_jid);
	local conditions = {};
	conditions[#conditions+1] = compile_jid_match_part(which.."_node", match_node);
	conditions[#conditions+1] = compile_jid_match_part(which.."_host", match_host);
	if match_resource then
		conditions[#conditions+1] = compile_jid_match_part(which.."_resource", match_resource);
	end
	return table.concat(conditions, " and ");
end

function condition_handlers.TO(to)
	return compile_jid_match("to", to), { "split_to" };
end

function condition_handlers.FROM(from)
	return compile_jid_match("from", from), { "split_from" };
end

function condition_handlers.FROM_FULL_JID()
	return "not "..compile_jid_match_part("from_resource", nil), { "split_from" };
end

function condition_handlers.FROM_EXACTLY(from)
	local metadeps = {};
	return ("from == %s"):format(metaq(from, metadeps)), { "from", unpack(metadeps) };
end

function condition_handlers.TO_EXACTLY(to)
	local metadeps = {};
	return ("to == %s"):format(metaq(to, metadeps)), { "to", unpack(metadeps) };
end

function condition_handlers.TO_SELF()
	-- Intentionally not using 'to' here, as that defaults to bare JID when nil
	return ("stanza.attr.to == nil");
end

function condition_handlers.TYPE(type)
	assert(type, "Expected 'type' value to match against");
	return compile_comparison_list("(type or (name == 'message' and 'normal') or (name == 'presence' and 'available'))", type), { "type", "name" };
end

local function zone_check(zone, which)
	local zone_var = zone;
	if zone == "$local" then zone_var = "_local" end
	local which_not = which == "from" and "to" or "from";
	return ("(zone_%s[%s_host] or zone_%s[%s] or zone_%s[bare_%s]) "
		.."and not(zone_%s[%s_host] or zone_%s[%s] or zone_%s[bare_%s])"
		)
		:format(zone_var, which, zone_var, which, zone_var, which,
		zone_var, which_not, zone_var, which_not, zone_var, which_not), {
			"split_to", "split_from", "bare_to", "bare_from", "zone:"..zone
		};
end

function condition_handlers.ENTERING(zone)
	return zone_check(zone, "to");
end

function condition_handlers.LEAVING(zone)
	return zone_check(zone, "from");
end

-- IN ROSTER? (parameter is deprecated)
function condition_handlers.IN_ROSTER(yes_no)
	local in_roster_requirement = string_to_boolean(yes_no or "yes"); -- COMPAT w/ older scripts
	return "not "..(in_roster_requirement and "not" or "").." roster_entry", { "roster_entry" };
end

function condition_handlers.IN_ROSTER_GROUP(group)
	return ("not not (roster_entry and roster_entry.groups[%q])"):format(group), { "roster_entry" };
end

function condition_handlers.SUBSCRIBED()
	return "(bare_to == bare_from or to_node and rostermanager.is_contact_subscribed(to_node, to_host, bare_from))",
	       { "rostermanager", "split_to", "bare_to", "bare_from" };
end

function condition_handlers.PENDING_SUBSCRIPTION_FROM_SENDER()
	return "(bare_to == bare_from or to_node and rostermanager.is_contact_pending_in(to_node, to_host, bare_from))",
	       { "rostermanager", "split_to", "bare_to", "bare_from" };
end

function condition_handlers.PAYLOAD(payload_ns)
	return ("stanza:get_child(nil, %q)"):format(payload_ns);
end

function condition_handlers.INSPECT(path)
	if path:find("=") then
		local query, match_type, value = path:match("(.-)([~/$]*)=(.*)");
		if not(query:match("#$") or query:match("@[^/]+")) then
			error("Stanza path does not return a string (append # for text content or @name for value of named attribute)", 0);
		end
		local meta_deps = {};
		local quoted_value = ("%q"):format(value);
		if match_type:find("$", 1, true) then
			match_type = match_type:gsub("%$", "");
			quoted_value = meta(quoted_value, meta_deps);
		end
		if match_type == "~" then -- Lua pattern match
			return ("(stanza:find(%q) or ''):match(%s)"):format(query, quoted_value), meta_deps;
		elseif match_type == "/" then -- find literal substring
			return ("(stanza:find(%q) or ''):find(%s, 1, true)"):format(query, quoted_value), meta_deps;
		elseif match_type == "" then -- exact match
			return ("stanza:find(%q) == %s"):format(query, quoted_value), meta_deps;
		else
			error("Unrecognised comparison '"..match_type.."='", 0);
		end
	end
	return ("stanza:find(%q)"):format(path);
end

function condition_handlers.FROM_GROUP(group_name)
	return ("group_contains(%q, bare_from)"):format(group_name), { "group_contains", "bare_from" };
end

function condition_handlers.TO_GROUP(group_name)
	return ("group_contains(%q, bare_to)"):format(group_name), { "group_contains", "bare_to" };
end

function condition_handlers.CROSSING_GROUPS(group_names)
	local code = {};
	for group_name in group_names:gmatch("([^, ][^,]+)") do
		group_name = group_name:match("^%s*(.-)%s*$"); -- Trim leading/trailing whitespace
		-- Just check that's it is crossing from outside group to inside group
		table.insert(code, ("(group_contains(%q, bare_to) and group_contains(%q, bare_from))"):format(group_name, group_name))
	end
	return "not "..table.concat(code, " or "), { "group_contains", "bare_to", "bare_from" };
end

-- COMPAT w/0.12: Deprecated
function condition_handlers.FROM_ADMIN_OF(host)
	return ("is_admin(bare_from, %s)"):format(host ~= "*" and metaq(host) or nil), { "is_admin", "bare_from" };
end

-- COMPAT w/0.12: Deprecated
function condition_handlers.TO_ADMIN_OF(host)
	return ("is_admin(bare_to, %s)"):format(host ~= "*" and metaq(host) or nil), { "is_admin", "bare_to" };
end

-- COMPAT w/0.12: Deprecated
function condition_handlers.FROM_ADMIN()
	return ("is_admin(bare_from, current_host)"), { "is_admin", "bare_from", "current_host" };
end

-- COMPAT w/0.12: Deprecated
function condition_handlers.TO_ADMIN()
	return ("is_admin(bare_to, current_host)"), { "is_admin", "bare_to", "current_host" };
end

-- MAY: permission_to_check
function condition_handlers.MAY(permission_to_check)
	return ("module:may(%q, event)"):format(permission_to_check);
end

function condition_handlers.TO_ROLE(role_name)
	return ("get_jid_role(bare_to, current_host) == %q"):format(role_name), { "get_jid_role", "current_host", "bare_to" };
end

function condition_handlers.FROM_ROLE(role_name)
	return ("get_jid_role(bare_from, current_host) == %q"):format(role_name), { "get_jid_role", "current_host", "bare_from" };
end

local day_numbers = { sun = 0, mon = 2, tue = 3, wed = 4, thu = 5, fri = 6, sat = 7 };

local function current_time_check(op, hour, minute)
	hour, minute = tonumber(hour), tonumber(minute);
	local adj_op = op == "<" and "<" or ">="; -- Start time inclusive, end time exclusive
	if minute == 0 then
		return "(current_hour"..adj_op..hour..")";
	else
		return "((current_hour"..op..hour..") or (current_hour == "..hour.." and current_minute"..adj_op..minute.."))";
	end
end

local function resolve_day_number(day_name)
	return assert(day_numbers[day_name:sub(1,3):lower()], "Unknown day name: "..day_name);
end

function condition_handlers.DAY(days)
	local conditions = {};
	for day_range in days:gmatch("[^,]+") do
		local day_start, day_end = day_range:match("(%a+)%s*%-%s*(%a+)");
		if day_start and day_end then
			local day_start_num, day_end_num = resolve_day_number(day_start), resolve_day_number(day_end);
			local op = "and";
			if day_end_num < day_start_num then
				op = "or";
			end
			table.insert(conditions, ("current_day >= %d %s current_day <= %d"):format(day_start_num, op, day_end_num));
		elseif day_range:find("%a") then
			local day = resolve_day_number(day_range:match("%a+"));
			table.insert(conditions, "current_day == "..day);
		else
			error("Unable to parse day/day range: "..day_range);
		end
	end
	assert(#conditions>0, "Expected a list of days or day ranges");
	return "("..table.concat(conditions, ") or (")..")", { "time:day" };
end

function condition_handlers.TIME(ranges)
	local conditions = {};
	for range in ranges:gmatch("([^,]+)") do
		local clause = {};
		range = range:lower()
			:gsub("(%d+):?(%d*) *am", function (h, m) return tostring(tonumber(h)%12)..":"..(tonumber(m) or "00"); end)
			:gsub("(%d+):?(%d*) *pm", function (h, m) return tostring(tonumber(h)%12+12)..":"..(tonumber(m) or "00"); end);
		local start_hour, start_minute = range:match("(%d+):(%d+) *%-");
		local end_hour, end_minute = range:match("%- *(%d+):(%d+)");
		local op = tonumber(start_hour) > tonumber(end_hour) and " or " or " and ";
		if start_hour and end_hour then
			table.insert(clause, current_time_check(">", start_hour, start_minute));
			table.insert(clause, current_time_check("<", end_hour, end_minute));
		end
		if #clause == 0 then
			error("Unable to parse time range: "..range);
		end
		table.insert(conditions, "("..table.concat(clause, " "..op.." ")..")");
	end
	return table.concat(conditions, " or "), { "time:hour,min" };
end

function condition_handlers.LIMIT(spec)
	local name, param = spec:match("^(%w+) on (.+)$");
	local meta_deps = {};

	if not name then
		name = spec:match("^%w+$");
		if not name then
			error("Unable to parse LIMIT specification");
		end
	else
		param = meta(("%q"):format(param), meta_deps);
	end

	if not param then
		return ("not global_throttle_%s:poll(1)"):format(name), { "globalthrottle:"..name, unpack(meta_deps) };
	end
	return ("not multi_throttle_%s:poll_on(%s, 1)"):format(name, param), { "multithrottle:"..name, unpack(meta_deps) };
end

function condition_handlers.ORIGIN_MARKED(name_and_time)
	local name, time = name_and_time:match("^%s*([%w_]+)%s+%(([^)]+)s%)%s*$");
	if not name then
		name = name_and_time:match("^%s*([%w_]+)%s*$");
	end
	if not name then
		error("Error parsing mark name, see documentation for usage examples");
	end
	if time then
		return ("(current_timestamp - (session.firewall_marked_%s or 0)) < %d"):format(idsafe(name), tonumber(time)), { "timestamp" };
	end
	return ("not not session.firewall_marked_"..idsafe(name));
end

function condition_handlers.USER_MARKED(name_and_time)
	local name, time = name_and_time:match("^%s*([%w_]+)%s+%(([^)]+)s%)%s*$");
	if not name then
		name = name_and_time:match("^%s*([%w_]+)%s*$");
	end
	if not name then
		error("Error parsing mark name, see documentation for usage examples");
	end
	if time then
		return ([[(
			current_timestamp - (session.firewall_marks and session.firewall_marks.%s or 0)
		) < %d]]):format(idsafe(name), tonumber(time)), { "timestamp" };
	end
	return ("not not (session.firewall_marks and session.firewall_marks."..idsafe(name)..")");
end

function condition_handlers.SENT_DIRECTED_PRESENCE_TO_SENDER()
	return "not not (session.directed and session.directed[from])", { "from" };
end

-- TO FULL JID?
function condition_handlers.TO_FULL_JID()
	return "not not full_sessions[to]", { "to", "full_sessions" };
end

-- CHECK LIST: spammers contains $<@from>
function condition_handlers.CHECK_LIST(list_condition)
	local list_name, expr = list_condition:match("(%S+) contains (.+)$");
	if not (list_name and expr) then
		error("Error parsing list check, syntax: LISTNAME contains EXPRESSION");
	end
	local meta_deps = {};
	expr = meta(("%q"):format(expr), meta_deps);
	return ("list_%s:contains(%s) == true"):format(list_name, expr), { "list:"..list_name, unpack(meta_deps) };
end

-- SCAN: body for word in badwords
function condition_handlers.SCAN(scan_expression)
	local search_name, pattern_name, list_name = scan_expression:match("(%S+) for (%S+) in (%S+)$");
	if not (search_name) then
		error("Error parsing SCAN expression, syntax: SEARCH for PATTERN in LIST");
	end
	return ("scan_list(list_%s, %s)"):format(
		list_name,
		"tokens_"..search_name.."_"..pattern_name
	), {
			"scan_list",
			"tokens:"..search_name.."-"..pattern_name, "list:"..list_name
	};
end

-- COUNT: lines in body < 10
local valid_comp_ops = { [">"] = ">", ["<"] = "<", ["="] = "==", ["=="] = "==", ["<="] = "<=", [">="] = ">=" };
function condition_handlers.COUNT(count_expression)
	local pattern_name, search_name, comparator_expression = count_expression:match("(%S+) in (%S+) (.+)$");
	if not (pattern_name) then
		error("Error parsing COUNT expression, syntax: PATTERN in SEARCH COMPARATOR");
	end
	local value;
	comparator_expression = comparator_expression:gsub("%d+", function (value_string)
		value = tonumber(value_string);
		return "";
	end);
	if not value then
		error("Error parsing COUNT expression, expected value");
	end
	local comp_op = comparator_expression:gsub("%s+", "");
	assert(valid_comp_ops[comp_op], "Error parsing COUNT expression, unknown comparison operator: "..comp_op);
	return ("it_count(search_%s:gmatch(pattern_%s)) %s %d"):format(
		search_name, pattern_name, comp_op, value
	), {
		"it_count",
		"search:"..search_name, "pattern:"..pattern_name
	};
end

return condition_handlers;
