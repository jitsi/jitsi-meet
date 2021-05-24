--- This is a port of Jicofo's Reservation System as a prosody module
--  ref: https://github.com/jitsi/jicofo/blob/master/doc/reservation.md
--
--  We try to retain the same behaviour and interfaces where possible, but there
--  is some difference:
--    * In the event that the DELETE call fails, Jicofo's reservation
--      system retains reservation data and allows re-creation of room if requested by
--      the same creator without making further call to the API; this module does not
--      offer this behaviour. Re-creation of a closed room will behave like a new meeting
--      and trigger a new API call to validate the reservation.
--    * Jicofo's reservation system expect int-based conflict_id. We take any sensible string.
--
--  In broad strokes, this module works by intercepting Conference IQs sent to focus component
--  and buffers it until reservation is confirmed (by calling the provided API endpoint).
--  The IQ events are routed on to focus component if reservation is valid, or error
--  response is sent back to the origin if reservation is denied. Events are routed as usual
--  if the room already exists.
--
--
--  Installation:
--  =============
--
--  Under domain config,
--   1. add "reservations" to modules_enabled.
--   2. Specify URL base for your API endpoint using "reservations_api_prefix" (required)
--   3. Optional config:
--      * set "reservations_api_timeout" to change API call timeouts (defaults to 20 seconds)
--      * set "reservations_api_headers" to specify custom HTTP headers included in
--        all API calls e.g. to provide auth tokens.
--      * set "reservations_api_retry_count" to the number of times API call failures are retried (defaults to 3)
--      * set "reservations_api_retry_delay" seconds to wait between retries (defaults to 3s)
--      * set "reservations_api_should_retry_for_code" to a function that takes an HTTP response code and
--        returns true if API call should be retried. By default, retries are done for 5XX
--        responses. Timeouts are never retried, and HTTP call failures are always retried.
--
--
--  Example config:
--
--    VirtualHost "jitmeet.example.com"
--        -- ....
--        modules_enabled = {
--            -- ....
--            "reservations";
--        }
--        reservations_api_prefix = "http://reservation.example.com"
--
--        --- The following are all optional
--        reservations_api_headers = {
--            ["Authorization"] = "Bearer TOKEN-237958623045";
--        }
--        reservations_api_timeout = 10  -- timeout if API does not respond within 10s
--        reservations_api_retry_count = 5  -- retry up to 5 times
--        reservations_api_retry_delay = 1  -- wait 1s between retries
--        reservations_api_should_retry_for_code = function (code)
--            return code >= 500 or code == 408
--        end
--


local jid = require 'util.jid';
local http = require "net.http";
local json = require "util.json";
local st = require "util.stanza";
local timer = require 'util.timer';
local datetime = require 'util.datetime';

local get_room_from_jid = module:require "util".get_room_from_jid;
local is_healthcheck_room = module:require "util".is_healthcheck_room;
local room_jid_match_rewrite = module:require "util".room_jid_match_rewrite;

local api_prefix = module:get_option("reservations_api_prefix");
local api_headers = module:get_option("reservations_api_headers");
local api_timeout = module:get_option("reservations_api_timeout", 20);
local api_retry_count = tonumber(module:get_option("reservations_api_retry_count", 3));
local api_retry_delay = tonumber(module:get_option("reservations_api_retry_delay", 3));


-- Option for user to control HTTP response codes that will result in a retry.
-- Defaults to returning true on any 5XX code or 0
local api_should_retry_for_code = module:get_option("reservations_api_should_retry_for_code", function (code)
   return code >= 500;
end)


local muc_component_host = module:get_option_string("main_muc");

-- How often to check and evict expired reservation data
local expiry_check_period = 60;


-- Cannot proceed if "reservations_api_prefix" not configured
if not api_prefix then
    module:log("error", "reservations_api_prefix not specified. Disabling %s", module:get_name());
    return;
end


-- get/infer focus component hostname so we can intercept IQ bound for it
local focus_component_host = module:get_option_string("focus_component");
if not focus_component_host then
    local muc_domain_base = module:get_option_string("muc_mapper_domain_base");
    if not muc_domain_base then
        module:log("error", "Could not infer focus domain. Disabling %s", module:get_name());
        return;
    end
    focus_component_host = 'focus.'..muc_domain_base;
end

-- common HTTP headers added to all API calls
local http_headers = {
    ["User-Agent"] = "Prosody ("..prosody.version.."; "..prosody.platform..")";
};
if api_headers then -- extra headers from config
    for key, value in pairs(api_headers) do
       http_headers[key] = value;
    end
end


--- Utils

--- Converts int timestamp to datetime string compatible with Java SimpleDateFormat
-- @param t timestamps in seconds. Supports int (as returned by os.time()) or higher
--          precision (as returned by socket.gettime())
-- @return formatted datetime string (yyyy-MM-dd'T'HH:mm:ss.SSSX)
local function to_java_date_string(t)
    local t_secs, mantissa = math.modf(t);
    local ms_str = (mantissa == 0) and '.000' or tostring(mantissa):sub(2,5);
    local date_str = os.date("!%Y-%m-%dT%H:%M:%S", t_secs);
    return date_str..ms_str..'Z';
end


--- Start non-blocking HTTP call
-- @param url URL to call
-- @param options options table as expected by net.http where we provide optional headers, body or method.
-- @param callback if provided, called with callback(response_body, response_code) when call complete.
-- @param timeout_callback if provided, called without args when request times out.
-- @param retries how many times to retry on failure; 0 means no retries.
local function async_http_request(url, options, callback, timeout_callback, retries)
    local completed = false;
    local timed_out = false;
    local retries = retries or api_retry_count;

    local function cb_(response_body, response_code)
        if not timed_out then  -- request completed before timeout
            completed = true;
            if (response_code == 0 or api_should_retry_for_code(response_code)) and retries > 0 then
                module:log("warn", "API Response code %d. Will retry after %ds", response_code, api_retry_delay);
                timer.add_task(api_retry_delay, function()
                    async_http_request(url, options, callback, timeout_callback, retries - 1)
                end)
                return;
            end

            if callback then
                callback(response_body, response_code)
            end
        end
    end

    local request = http.request(url, options, cb_);

    timer.add_task(api_timeout, function ()
        timed_out = true;

        if not completed then
            http.destroy_request(request);
            if timeout_callback then
                timeout_callback()
            end
        end
    end);

end

--- Returns current timestamp
local function now()
    -- Don't really need higher precision of socket.gettime(). Besides, we loose
    -- milliseconds precision when converting back to timestamp from date string
    -- when we use datetime.parse(t), so let's be consistent.
    return os.time();
end

--- Start RoomReservation implementation

-- Status enums used in RoomReservation:meta.status
local STATUS = {
    PENDING = 0;
    SUCCESS = 1;
    FAILED  = -1;
}

local RoomReservation = {};
RoomReservation.__index = RoomReservation;

function newRoomReservation(room_jid, creator_jid)
    return setmetatable({
        room_jid = room_jid;

        -- Reservation metadata. store as table so we can set and read atomically.
        -- N.B. This should always be updated using self.set_status_*
        meta = {
            status = STATUS.PENDING;
            mail_owner = jid.bare(creator_jid);
            conflict_id = nil;
            start_time = now();  -- timestamp, in seconds
            expires_at = nil;  -- timestamp, in seconds
            error_text = nil;
            error_code = nil;
        };

        -- Array of pending events that we need to route once API call is complete
        pending_events = {};

        -- Set true when API call trigger has been triggered (by enqueue of first event)
        api_call_triggered = false;
    }, RoomReservation);
end


--- Extracts room name from room jid
function RoomReservation:get_room_name()
    return jid.node(self.room_jid);
end

--- Checks if reservation data is expires and should be evicted from store
function RoomReservation:is_expired()
    return self.meta.expires_at ~= nil and now() > self.meta.expires_at;
end

--- Main entry point for handing and routing events.
function RoomReservation:enqueue_or_route_event(event)
    if self.meta.status == STATUS.PENDING then
        table.insert(self.pending_events, event)
        if not self.api_call_triggered == true then
            self:call_api_create_conference();
        end
    else
        -- API call already complete. Immediately route without enqueueing.
        -- This could happen if request comes in between the time reservation approved
        -- and when Jicofo actually creates the room.
        module:log("debug", "Reservation details already stored. Skipping queue for %s", self.room_jid);
        self:route_event(event);
    end
end

--- Updates status and initiates event routing. Called internally when API call complete.
function RoomReservation:set_status_success(start_time, duration, mail_owner, conflict_id)
    module:log("info", "Reservation created successfully for %s", self.room_jid);
    self.meta = {
        status = STATUS.SUCCESS;
        mail_owner = mail_owner or self.meta.mail_owner;
        conflict_id = conflict_id;
        start_time = start_time;
        expires_at = start_time + duration;
        error_text = nil;
        error_code = nil;
    }
    self:route_pending_events()
end

--- Updates status and initiates error response to pending events. Called internally when API call complete.
function RoomReservation:set_status_failed(error_code, error_text)
    module:log("info", "Reservation creation failed for %s - (%s) %s", self.room_jid, error_code, error_text);
    self.meta = {
        status = STATUS.FAILED;
        mail_owner = self.meta.mail_owner;
        conflict_id = nil;
        start_time = self.meta.start_time;
        -- Retain reservation rejection for a short while so we have time to report failure to
        -- existing clients and not trigger a re-query too soon.
        -- N.B. Expiry could take longer since eviction happens periodically.
        expires_at = now() + 30;
        error_text = error_text;
        error_code = error_code;
    }
    self:route_pending_events()
end

--- Triggers routing of all enqueued events
function RoomReservation:route_pending_events()
    if self.meta.status == STATUS.PENDING then  -- should never be called while PENDING. check just in case.
        return;
    end

    module:log("debug", "Routing all pending events for %s", self.room_jid);
    local event;

    while #self.pending_events ~= 0 do
        event = table.remove(self.pending_events);
        self:route_event(event)
    end
end

--- Event routing implementation
function RoomReservation:route_event(event)
    -- this should only be called after API call complete and status no longer PENDING
    assert(self.meta.status ~= STATUS.PENDING, "Attempting to route event while API call still PENDING")

    local meta = self.meta;
    local origin, stanza = event.origin, event.stanza;

    if meta.status == STATUS.FAILED then
        module:log("debug", "Route: Sending reservation error to %s", stanza.attr.from);
        self:reply_with_error(event, meta.error_code, meta.error_text);
    else
        if meta.status == STATUS.SUCCESS then
            if self:is_expired() then
                module:log("debug", "Route: Sending reservation expiry to %s", stanza.attr.from);
                self:reply_with_error(event, 419, "Reservation expired");
            else
                module:log("debug", "Route: Forwarding on event from %s", stanza.attr.from);
                prosody.core_post_stanza(origin, stanza, false); -- route iq to intended target (focus)
            end
        else
            -- this should never happen unless dev made a mistake. Block by default just in case.
            module:log("error", "Reservation for %s has invalid state %s. Rejecting request.", self.room_jid, meta.status);
            self:reply_with_error(event, 500, "Failed to determine reservation state");
        end
    end
end

--- Generates reservation-error stanza and sends to event origin.
function RoomReservation:reply_with_error(event, error_code, error_text)
    local stanza = event.stanza;
    local id = stanza.attr.id;
    local to = stanza.attr.from;
    local from = stanza.attr.to;

    event.origin.send(
        st.iq({ type="error", to=to, from=from, id=id })
            :tag("error", { type="cancel" })
                :tag("service-unavailable", { xmlns="urn:ietf:params:xml:ns:xmpp-stanzas" }):up()
                :tag("text", { xmlns="urn:ietf:params:xml:ns:xmpp-stanzas" }):text(error_text):up()
                :tag("reservation-error", { xmlns="http://jitsi.org/protocol/focus", ["error-code"]=tostring(error_code) })
    );
end

--- Initiates non-blocking API call to validate reservation
function RoomReservation:call_api_create_conference()
    self.api_call_triggered = true;

    local url = api_prefix..'/conference';
    local request_data = {
        name = self:get_room_name();
        start_time = to_java_date_string(self.meta.start_time);
        mail_owner = self.meta.mail_owner;
    }

    local http_options = {
        body = http.formencode(request_data);  -- because Jicofo reservation encodes as form data instead JSON
        method = 'POST';
        headers = http_headers;
    }

    module:log("debug", "Sending POST /conference for %s", self.room_jid);
    async_http_request(url, http_options, function (response_body, response_code)
        self:on_api_create_conference_complete(response_body, response_code);
    end, function ()
        self:on_api_call_timeout();
    end);
end

--- Parses and validates HTTP response body for conference payload
--  Ref: https://github.com/jitsi/jicofo/blob/master/doc/reservation.md
--  @return nil if invalid, or table with keys "id", "name", "mail_owner", "start_time", "duration".
function RoomReservation:parse_conference_response(response_body)
    local data = json.decode(response_body);

    if data == nil then  -- invalid JSON payload
        module:log("error", "Invalid JSON response from API - %s", response_body);
        return;
    end

    if data.name == nil or data.name:lower() ~= self:get_room_name() then
        module:log("error", "Missing or mismathing room name - %s", data.name);
        return;
    end

    if data.id == nil then
        module:log("error", "Missing id");
        return;
    end

    if data.mail_owner == nil then
        module:log("error", "Missing mail_owner");
        return;
    end

    local duration = tonumber(data.duration);
    if duration == nil then
        module:log("error", "Missing or invalid duration - %s", data.duration);
        return;
    end
    data.duration = duration;

    local start_time = datetime.parse(data.start_time);  -- N.B. we lose milliseconds portion of the date
    if start_time == nil then
        module:log("error", "Missing or invalid start_time - %s", data.start_time);
        return;
    end
    data.start_time = start_time;

    return data;
end

--- Parses and validates HTTP error response body for API call.
--  Expect JSON with a "message" field.
--  @return message string, or generic error message if invalid payload.
function RoomReservation:parse_error_message_from_response(response_body)
    local data = json.decode(response_body);
    if data ~= nil and data.message ~= nil then
        module:log("debug", "Invalid error response body. Will use generic error message.");
        return data.message;
    else
        return "Rejected by reservation server";
    end
end

--- callback on API timeout
function RoomReservation:on_api_call_timeout()
    self:set_status_failed(500, 'Reservation lookup timed out');
end

--- callback on API response
function RoomReservation:on_api_create_conference_complete(response_body, response_code)
    if response_code == 200 or response_code == 201 then
        self:handler_conference_data_returned_from_api(response_body);
    elseif response_code == 409 then
        self:handle_conference_already_exist(response_body);
    elseif response_code == nil then  -- warrants a retry, but this should be done automatically by the http call method.
        self:set_status_failed(500, 'Could not contact reservation server');
    else
        self:set_status_failed(response_code, self:parse_error_message_from_response(response_body));
    end
end

function RoomReservation:handler_conference_data_returned_from_api(response_body)
    local data = self:parse_conference_response(response_body);
    if not data then  -- invalid response from API
        module:log("error", "API returned success code but invalid payload");
        self:set_status_failed(500, 'Invalid response from reservation server');
    else
        self:set_status_success(data.start_time, data.duration, data.mail_owner, data.id)
    end
end

function RoomReservation:handle_conference_already_exist(response_body)
    local data = json.decode(response_body);
    if data == nil or data.conflict_id == nil then
        -- yes, in the case of 409, API expected to return "id" as "conflict_id".
        self:set_status_failed(409, 'Invalid response from reservation server');
    else
        local url = api_prefix..'/conference/'..data.conflict_id;
        local http_options = {
            method = 'GET';
            headers = http_headers;
        }

        async_http_request(url, http_options, function(response_body, response_code)
            if response_code == 200 then
                self:handler_conference_data_returned_from_api(response_body);
            else
                self:set_status_failed(response_code, self:parse_error_message_from_response(response_body));
            end
        end, function ()
            self:on_api_call_timeout();
        end);
    end
end

--- End RoomReservation

--- Store reservations lookups that are still pending or with room still active
local reservations = {}

local function get_or_create_reservations(room_jid, creator_jid)
    if reservations[room_jid] == nil then
        module:log("debug", "Creating new reservation data for %s", room_jid);
        reservations[room_jid] = newRoomReservation(room_jid, creator_jid);
    end

    return reservations[room_jid];
end

local function evict_expired_reservations()
    local expired = {}

    -- first, gather jids of expired rooms. So we don't remove from table while iterating.
    for room_jid, res in pairs(reservations) do
        if res:is_expired() then
            table.insert(expired, room_jid);
        end
    end

    local room;
    for _, room_jid in ipairs(expired) do
        room = get_room_from_jid(room_jid);
        if room then
            -- Close room if still active (reservation duration exceeded)
            module:log("info", "Room exceeded reservation duration. Terminating %s", room_jid);
            room:destroy(nil, "Scheduled conference duration exceeded.");
            -- Rely on room_destroyed to calls DELETE /conference and drops reservation[room_jid]
        else
            module:log("error", "Reservation references expired room that is no longer active. Dropping %s", room_jid);
            -- This should not happen unless evict_expired_reservations somehow gets triggered
            -- between the time room is destroyed and room_destroyed callback is called. (Possible?)
            -- But just in case, we drop the reservation to avoid repeating this path on every pass.
            reservations[room_jid] = nil;
        end
    end
end

timer.add_task(expiry_check_period, function()
    evict_expired_reservations();
    return expiry_check_period;
end)


--- Intercept conference IQ to Jicofo handle reservation checks before allowing normal event flow
module:log("info", "Hook to global pre-iq/host");
module:hook("pre-iq/host", function(event)
    local stanza = event.stanza;

    if stanza.name ~= "iq" or stanza.attr.to ~= focus_component_host or stanza.attr.type ~= 'set' then
        return;  -- not IQ for jicofo. Ignore this event.
    end

    local conference = stanza:get_child('conference', 'http://jitsi.org/protocol/focus');
    if conference == nil then
        return; -- not Conference IQ. Ignore.
    end

    local room_jid = room_jid_match_rewrite(conference.attr.room);

    if get_room_from_jid(room_jid) ~= nil then
        module:log("debug", "Skip reservation check for existing room %s", room_jid);
        return;  -- room already exists. Continue with normal flow
    end

    local res = get_or_create_reservations(room_jid, stanza.attr.from);
    res:enqueue_or_route_event(event);  -- hand over to reservation obj to route event
    return true;

end);


--- Forget reservation details once room destroyed so query is repeated if room re-created
local function room_destroyed(event)
    local res;
    local room = event.room

    if not is_healthcheck_room(room.jid) then
        res = reservations[room.jid]

        -- drop reservation data for this room
        reservations[room.jid] = nil

        if res then  -- just in case event triggered more than once?
            module:log("info", "Dropped reservation data for destroyed room %s", room.jid);

            local conflict_id = res.meta.conflict_id
            if conflict_id then
                local url = api_prefix..'/conference/'..conflict_id;
                local http_options = {
                    method = 'DELETE';
                    headers = http_headers;
                }

                module:log("debug", "Sending DELETE /conference/%s", conflict_id);
                async_http_request(url, http_options);
            end
        end
    end
end


function process_host(host)
    if host == muc_component_host then -- the conference muc component
        module:log("info", "Hook to muc events on %s", host);
        module:context(host):hook("muc-room-destroyed", room_destroyed, -1);
    end
end

if prosody.hosts[muc_component_host] == nil then
    module:log("info", "No muc component found, will listen for it: %s", muc_component_host)
    prosody.events.add_handler("host-activated", process_host);
else
    process_host(muc_component_host);
end
