module:set_global();

local loggingmanager = require "core.loggingmanager";
local format = require "util.format".format;
local pposix = require "util.pposix";
local rb = require "util.ringbuffer";
local queue = require "util.queue";

local default_timestamp = "%b %d %H:%M:%S ";
local max_chunk_size = module:get_option_number("log_ringbuffer_chunk_size", 16384);

local os_date = os.date;

local default_filename_template = "{paths.data}/ringbuffer-logs-{pid}-{count}.log";
local render_filename = require "util.interpolation".new("%b{}", function (s) return s; end, {
	yyyymmdd = function (t)
		return os_date("%Y%m%d", t);
	end;
	hhmmss = function (t)
		return os_date("%H%M%S", t);
	end;
});

local dump_count = 0;

local function dump_buffer(dump, filename)
	dump_count = dump_count + 1;
	local f, err = io.open(filename, "a+");
	if not f then
		module:log("error", "Unable to open output file: %s", err);
		return;
	end
	f:write(("-- Dumping log buffer at %s --\n"):format(os_date(default_timestamp)));
	dump(f);
	f:write("-- End of dump --\n\n");
	f:close();
end

local function get_filename(filename_template)
	filename_template = filename_template or default_filename_template;
	return render_filename(filename_template, {
		paths = prosody.paths;
		pid = pposix.getpid();
		count = dump_count;
		time = os.time();
	});
end

local function new_buffer(config)
	local write, dump;

	if config.lines then
		local buffer = queue.new(config.lines, true);
		function write(line)
			buffer:push(line);
		end
		function dump(f)
			-- COMPAT w/0.11 - update to use :consume()
			for line in buffer.pop, buffer do
				f:write(line);
			end
		end
	else
		local buffer_size = config.size or 100*1024;
		local buffer = rb.new(buffer_size);
		function write(line)
			if not buffer:write(line) then
				if #line > buffer_size then
					buffer:discard(buffer_size);
					buffer:write(line:sub(-buffer_size));
				else
					buffer:discard(#line);
					buffer:write(line);
				end
			end
		end
		function dump(f)
			local bytes_remaining = buffer:length();
			while bytes_remaining > 0 do
				local chunk_size = math.min(bytes_remaining, max_chunk_size);
				local chunk = buffer:read(chunk_size);
				if not chunk then
					return;
				end
				f:write(chunk);
				bytes_remaining = bytes_remaining - chunk_size;
			end
		end
	end
	return write, dump;
end

local function ringbuffer_log_sink_maker(sink_config)
	local write, dump = new_buffer(sink_config);

	local timestamps = sink_config.timestamps;

	if timestamps == true or timestamps == nil then
		timestamps = default_timestamp; -- Default format
	elseif timestamps then
		timestamps = timestamps .. " ";
	end

	local function handler()
		dump_buffer(dump, sink_config.filename or get_filename(sink_config.filename_template));
	end

	if sink_config.signal then
		require "util.signal".signal(sink_config.signal, handler);
	elseif sink_config.event then
		module:hook_global(sink_config.event, handler);
	end

	return function (name, level, message, ...)
		local line = format("%s%s\t%s\t%s\n", timestamps and os_date(timestamps) or "", name, level, format(message, ...));
		write(line);
	end;
end

loggingmanager.register_sink_type("ringbuffer", ringbuffer_log_sink_maker);
