-- Log common stats to influxdb or to a log file
--
-- Authors: Marcus Stong
--
-- Contributors: Daurnimator
--
-- This module is MIT/X11 licensed.

local socket = require "socket"
local iterators = require "util.iterators"
local cjson = require "cjson"
local options = module:get_option("talky_metrics") or {}
local serialization = require "util.serialization"
local logging = require "logging"

prosody.unlock_globals()
require"logging.rolling_file"
prosody.lock_globals()

module:log("info", "talky_metrics module File Logger")
-- Initialize file logging
-- Log destination
local log_file = options.log_file or "/var/log/prosody/presence.log"
-- How big should the metrics logs get until rotation
local log_size = options.log_size or 102400000
-- How many log files to keep
local log_index = options.log_index or 10
-- Instantiate log rotation
local logger = logging.rolling_file(log_file, log_size, log_index, "%message\n")
-- Log JSON to file
function send(s)
    return logger:info(s)
end

local timestamp = math.floor(socket.gettime()*1000)

-- Metrics are namespaced by ".", and seperated by newline
--local prefix = timestamp .. "|" ..(options.prefix or "prosody") .. "."
local prefix = (options.prefix or "prosody") .. "."

-- Standard point formatting
function prepare_point(name, point, host)
  local hostname = host or module.host
  table.insert(point.points, hostname)
  if point.columns then
    table.insert(point.columns, "host")
  end

  local point_serialized = {
    name = prefix..name,
    columns = point.columns or { "value", "host" },
    points = { point.points }
  }
  return point_serialized
end


-- Reload config changes
module:hook_global("config-reloaded", function()
  --if not options.log_to_file then
  --    sock:setpeername(options.hostname or "10.30.1.55", options.port or 8083)
  --end
  prefix = (options.prefix or "prosody") .. "."
  anonymous = options.anonymous or false
end);

-- Track users as they bind/unbind
-- count bare sessions every time, as we have no way to tell if it's a new bare session or not
module:hook("resource-bind", function(event)
  local message = {}
  message["timestamp"] = timestamp
  message["action"] = "bind"
  --message["session"] = event.session
  message["session"] = {}
  message.session["type"] = event.session.type
  --Privacy Sensetive!! PII Username!
  message.session["username"] = event.session.username or "anonymous"
  message.session["host"] = event.session.host or "localhost"
  message.session["full_jid"] = event.session.full_jid or ""
  --Privacy Sensetive!! PII client IP!
  message.session["ip"] = event.session.ip or "127.1"
  message.session["priority"] = event.session.priority or "none"
  message.session["presence"] = event.session.presence or nil
  message.session["interested"] = event.session.interested or nil
  --Privacy Sensetive!! PII Rostor!
  -- message.session["roster"] = event.session.roster or nil  
  table.insert(message, prepare_point("stats", { columns = { "metric", "value" }, points = { "bare_sessions", iterators.count(pairs(bare_sessions)) }}))
  --table.insert(message, prepare_point("stats", { columns = { "metric", "value" }, points = { "full_sessions", 1 }}))
  send(cjson.encode(message))
end, 1)


module:hook("resource-unbind", function(event)
  local message = {}
  message["timestamp"] = timestamp
  message["action"] = "unbind"
  --message["session"] = event.session
  message["session"] = {}
  message.session["type"] = event.session.type
  --Privacy Sensetive!! PII Username!
  message.session["username"] = event.session.username or "anonymous"
  message.session["host"] = event.session.host or "localhost"
  message.session["full_jid"] = event.session.full_jid or ""
  --Privacy Sensetive!! PII client IP!
  message.session["ip"] = event.session.ip or "127.1"
  message.session["priority"] = event.session.priority or "none"
  message.session["presence"] = event.session.presence or nil
  message.session["interested"] = event.session.interested or nil
  --Privacy Sensetive!! PII Rostor!
  -- message.session["roster"] = event.session.roster or nil
  table.insert(message, prepare_point("stats", { columns = { "metric", "value" }, points = { "bare_sessions", iterators.count(pairs(bare_sessions)) }}))
  --table.insert(message, prepare_point("stats", { columns = { "metric", "value" }, points = { "full_sessions", 1 }}))
  send(cjson.encode(message))
end, 1)

-- Track MUC occupants as they join/leave
module:hook("muc-occupant-joined", function(event)
  local message = {}
  message["timestamp"] = timestamp
  message["action"] = "occupant-join"
  message["room"] = event.room or "unknown"
  message["nick"] = event.nick or "anonymous"
  message["occupant"] = event.occupant or nil
  message["stanza"] = event.stanza or nil
  message["origin"] = event.origin or nil
  table.insert(message, prepare_point("stats", { columns = { "metric", "value" }, points = { "n_occupants", 1 }}))
  send(cjson.encode(message))
end)

module:hook("muc-occupant-left", function(event)
  local message = {}
  message["timestamp"] = timestamp
  message["action"] = "occupant-left"
  message["room"] = event.room or "unknown"
  message["nick"] = event.nick or "anonymous"
  message["occupant"] = event.occupant or nil
  message["stanza"] = event.stanza or nil
  message["origin"] = event.origin or nil
  table.insert(message, prepare_point("stats", { columns = { "metric", "value" }, points = { "n_occupants", -1 }}))
  send(cjson.encode(message))
end)

-- Misc other MUC
module:hook("muc-broadcast-message", function(event)
  local message = {}
  message["timestamp"] = timestamp
  message["action"] = "broadcast-message"
  message["room"] = event.room or "unknown"
  message["stanza"] = event.stanza or nil 
  table.insert(message, prepare_point("stats", { columns = { "metric", "value" }, points = { "broadcast-message", 1 }}))
  send(cjson.encode(message))
end)

module:hook("muc-invite", function(event)
  local message = {}
  message["timestamp"] = timestamp
  message["action"] = "invited"
  message["room"] = event.room or "unknown"
  message["origin"] = event.origin or "unknown"
  message["stanza"] = event.stanza or "unknown"
  message["incoming"] = event.incoming or "unknown"
  --room = self, stanza = invite, origin = origin, incoming = stanza

  -- Total count
  table.insert(message, prepare_point("stats", { columns = { "metric", "value" }, points = { "invite", 1 }}))
  send(cjson.encode(message))
end)

module:hook("muc-decline", function(event)
  local message = {}
  message["timestamp"] = timestamp
  message["action"] = "declined"
  -- Total count
  table.insert(message, prepare_point("stats", { columns = { "metric", "value" }, points = { "decline", 1 }}))
  send(cjson.encode(message))
end)

module:hook("muc-room-pre-create", function(event)
  local message = {}
  message["timestamp"] = timestamp
  message["action"] = "pre-create"
  message["room"] = event.room or "unknown"
  --message["reason"] = event.reason or "unknown" 
  -- Total count
  table.insert(message, prepare_point("stats", { columns = { "metric", "value" }, points = { "n_rooms", 1 }}))
  send(cjson.encode(message))
end)

module:hook("muc-room-created", function(event)
  local message = {}
  message["timestamp"] = timestamp
  message["action"] = "room-created"
  message["room"] = event.room or "unknown"
  message["creator"] = event.creator or "unknown"
  --message["reason"] = event.reason or "unknown" 
  -- Total count
  table.insert(message, prepare_point("stats", { columns = { "metric", "value" }, points = { "n_rooms", 1 }}))
  send(cjson.encode(message))
end)

module:hook("muc-room-destroyed", function(event)
  local message = {}
  message["timestamp"] = timestamp
  message["action"] = "room-destroy"
  message["room"] = event.room or "unknown"
  message["reason"] = event.reason or "unknown" 
  -- Total count
  table.insert(message, prepare_point("stats", { columns = { "metric", "value" }, points = { "n_rooms", -1 }}))
  send(cjson.encode(message))
end)

--module:hook_global("stats-updated", function(event)
--  if event.stats then
--    local message = {}
--    message["timestamp"] = timestamp
--    --module:log("info", "stats updated: %s ", serialization.serialize(event))
--    local data = {
--      columns= {},
--      points = {}
--    }
--    for k,v in pairs(event.stats) do
--      local value = tonumber(v)
--      if value then -- only numeric stats
--          table.insert(data.columns, k)
--          table.insert(data.points, value)
--      end
--    end
--    table.insert(message, prepare_point("stats", { columns = data.columns, points = data.points }))
--    --module:log("info", "colibri series %s: ", serialization.serialize(message))
--    send(cjson.encode(message))
--  end
--end)

--module:hook("colibri-stats", function(event)
--  local message = {}
--  message["timestamp"] = timestamp
--  -- we'll set this as host in these metrics
--  local host = event.bridge
--  local name = "jvb"
--  local data = {
--      columns= {},
--      points = {}
--  }
--  -- iterate over each stat
--  for k,v in pairs(event.stats) do
--      local value = tonumber(v)
--      if value then -- only numeric stats
--          table.insert(data.columns, k)
--          table.insert(data.points, value)
--      end
--  end
--  table.insert(message, prepare_point(name, { columns = data.columns, points = data.points }, host))
--  --module:log("info", "colibri series %s: ", serialization.serialize(message))
--  send(cjson.encode(message))
--end)

--module:hook("eventlog-stat", function(event)
--  local message = {}
--  message["timestamp"] = timestamp
--  --module:log("info", "eventlog stat %s: ", serialization.serialize(event))
--  --iterate over each stat
--  local category = event.category
--  local meta = event.meta
--  local from = event.from
--  local service = event.service
--  local metric = event.metric
--  local value = tonumber(event.value)
--  local data = {
--      columns = {
--          "metric", "from", "value"
--      },
--      points = {
--          metric, from, value
--      }
--  }
--  if category then
--      table.insert(data.columns, "category")
--      table.insert(data.points, category)
--  end
--  if meta then
--      for k,v in pairs(meta) do
--          table.insert(data.columns, "meta_" .. k)
--          table.insert(data.points, v)
--      end
--  end
--  table.insert(message, prepare_point("client", data, service))
--  --module:log("info", "client series %s: ", serialization.serialize(message))
--  send(cjson.encode(message))
--end)


-- Track users as they authenticate/failtoauthenticate
module:hook("authentication-succes", function(event)
  local message = {}
  message["timestamp"] = timestamp
  message["action"] = "authenticated"
  message["session"] = {}
  message.session["type"] = event.session.type
  --Privacy Sensetive!! PII Username!
  message.session["username"] = event.session.username or "anonymous"
  message.session["host"] = event.session.host or "localhost"
  message.session["full_jid"] = event.session.full_jid or ""
  --Privacy Sensetive!! PII client IP!
  message.session["ip"] = event.session.ip or "127.1"
  message.session["priority"] = event.session.priority or "none"
  message.session["presence"] = event.session.presence or nil
  message.session["interested"] = event.session.interested or nil
  --Privacy Sensetive!! PII Rostor!
  -- message.session["roster"] = event.session.roster or nil
  table.insert(message, prepare_point("test", {columns = {"test"}, points = {timestamp} }))
  --table.insert(message, prepare_point("stats", { columns = { "metric", "value" }, points = { "bare_sessions", iterators.count(pairs(bare_sessions)) }}))
  --table.insert(message, prepare_point("stats", { columns = { "metric", "value" }, points = { "full_sessions", 1 }}))
  send(cjson.encode(message))
end)

module:hook("authentication-failure", function(event)
  local message = {}
  message["timestamp"] = timestamp
  message["action"] = "authentication-failure"
  --message["session"] = event.session
  message["session"] = {}
  message.session["type"] = event.session.type
  --Privacy Sensetive!! PII Username!
  message.session["username"] = event.session.username or "anonymous"
  message.session["host"] = event.session.host or "localhost"
  message.session["full_jid"] = event.session.full_jid or ""
  --Privacy Sensetive!! PII client IP!
  message.session["ip"] = event.session.ip or "127.1"
  message.session["priority"] = event.session.priority or "none"
  message.session["presence"] = event.session.presence or nil
  message.session["interested"] = event.session.interested or nil
  --Privacy Sensetive!! PII Rostor!
  -- message.session["roster"] = event.session.roster or nil
  -- message["raw"] = event
  table.insert(message, prepare_point("test", {columns = {"test"}, points = {timestamp} }))
  --table.insert(message, prepare_point("stats", { columns = { "metric", "value" }, points = { "bare_sessions", iterators.count(pairs(bare_sessions)) }}))
  --table.insert(message, prepare_point("stats", { columns = { "metric", "value" }, points = { "full_sessions", 1 }}))
  send(cjson.encode(message))
end)

module:log("info", "Loaded talky_metrics module")
