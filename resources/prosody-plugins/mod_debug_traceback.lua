module:set_global();

local traceback = require "util.debug".traceback;
local pposix = require "util.pposix";
local os_date = os.date;
local render_filename = require "util.interpolation".new("%b{}", function (s) return s; end, {
	yyyymmdd = function (t)
		return os_date("%Y%m%d", t);
	end;
	hhmmss = function (t)
		return os_date("%H%M%S", t);
	end;
});

local count = 0;

local function get_filename(filename_template)
	filename_template = filename_template;
	return render_filename(filename_template, {
		paths = prosody.paths;
		pid = pposix.getpid();
		count = count;
		time = os.time();
	});
end

local default_filename_template = "{paths.data}/traceback-{pid}-{count}.log";
local filename_template = module:get_option_string("debug_traceback_filename", default_filename_template);
local signal_name = module:get_option_string("debug_traceback_signal", "SIGUSR1");

function dump_traceback()
	module:log("info", "Received %s, writing traceback", signal_name);

	local tb = traceback();
	module:fire_event("debug_traceback/triggered", { traceback = tb });

	local f, err = io.open(get_filename(filename_template), "a+");
	if not f then
		module:log("error", "Unable to write traceback: %s", err);
		return;
	end
	f:write("-- Traceback generated at ", os.date("%b %d %H:%M:%S"), " --\n");
	f:write(tb, "\n");
	f:write("-- End of traceback --\n");
	f:close();
	count = count + 1;
end

local mod_posix = module:depends("posix");
if rawget(mod_posix, "features") and mod_posix.features.signal_events then
	module:hook("signal/"..signal_name, dump_traceback);
else
	require"util.signal".signal(signal_name, dump_traceback);
end
