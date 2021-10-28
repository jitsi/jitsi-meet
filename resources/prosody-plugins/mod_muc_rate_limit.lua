-- enable under the main muc component

local queue = require "util.queue";
local new_throttle = require "util.throttle".create;
local timer = require "util.timer";

-- we max to 500 participants per meeting so this should be enough, we are not suppose to handle all
-- participants in one meeting
local PRESENCE_QUEUE_MAX_SIZE = 1000;

-- default to 5 participants per second
local join_rate_per_conference = module:get_option_number("muc_rate_joins", 5);

-- Measure/monitor the room rate limiting queue
local measure = require "core.statsmanager".measure;
local measure_longest_queue = measure("distribution",
        "/mod_" .. module.name .. "/longest_queue");
local measure_rooms_with_queue = measure("rate",
        "/mod_" .. module.name .. "/rooms_with_queue");

-- throws a stat that the queue was full, counts the total number of times we hit it
local measure_full_queue = measure("rate",
        "/mod_" .. module.name .. "/full_queue");

-- keeps track of the total times we had an error processing the queue
local measure_errors_processing_queue = measure("rate",
        "/mod_" .. module.name .. "/errors_processing_queue");

-- we keep track here what was the longest queue we have seen
local stat_longest_queue = 0;

-- Adds item to the queue
-- @returns false if queue is full and item was not added, true otherwise
local function add_item_to_queue(joining_queue, item, room, from)
    if not joining_queue:push(item) then
        module:log('error', 'Error pushing presence in queue for %s in %s', from, room.jid);

        measure_full_queue();
        return false;
    else
        -- check is this the longest queue and if so throws a stat
        if joining_queue:count() > stat_longest_queue then
            stat_longest_queue = joining_queue:count();
            measure_longest_queue(stat_longest_queue);
        end

        return true;
    end
end

-- process join_rate_presence_queue in the room and pops element passing them to handle_normal_presence
-- returns 1 if we want to reschedule it after 1 second
local function timer_process_queue_elements (room)
    local presence_queue = room.join_rate_presence_queue;

    if not presence_queue or presence_queue:count() == 0 then
        return;
    end

    for _ = 1, join_rate_per_conference do
        local ev = presence_queue:pop();
        if ev then
            -- we mark what we pass here so we can skip it on the next muc-occupant-pre-join event
            ev.stanza.delayed_join_skip = true;
            room:handle_normal_presence(ev.origin, ev.stanza);
        end
    end

    -- if there are elements left, schedule an execution in a second
    if presence_queue:count() > 0 then
        return 1;
    else
        room.join_rate_queue_timer = false;
    end
end

-- we check join rate before occupant joins. If rate is exceeded we queue the events and start a timer
-- that will run every second processing the events passing them to the room handling function handle_normal_presence
-- from where those arrived, this way we keep a maximum rate of joining
module:hook("muc-occupant-pre-join", function (event)
    local room, stanza = event.room, event.stanza;

    -- skipping events we had produced and clear our flag
    if stanza.delayed_join_skip == true then
        event.stanza.delayed_join_skip = nil;
        return false;
    end

    local throttle = room.join_rate_throttle;
    if not room.join_rate_throttle then
        throttle = new_throttle(join_rate_per_conference, 1); -- rate per one second
        room.join_rate_throttle = throttle;
    end

    if not throttle:poll(1) then
        if not room.join_rate_presence_queue then
            -- if this is the first item for a room we increment the stat for rooms with queues
            measure_rooms_with_queue();
            room.join_rate_presence_queue = queue.new(PRESENCE_QUEUE_MAX_SIZE);
        end

        if not add_item_to_queue(room.join_rate_presence_queue, event, room, stanza.attr.from) then
            -- let's not stop processing the event
            return false;
        end

        if not room.join_rate_queue_timer then
            timer.add_task(1, function ()
                local status, result = pcall(timer_process_queue_elements, room);
                if not status then
                    -- there was an error in the timer function
                    module:log('error', 'Error processing queue: %s', result);

                    measure_errors_processing_queue();

                    -- let's re-schedule timer so we do not lose the queue
                    return 1;
                end

                return result;
            end);
            room.join_rate_queue_timer = true;
        end

        return true; -- we stop execution, so we do not process this join at the moment
    end

    if room.join_rate_queue_timer then
        -- there is timer so we need to order the presences, put it in the queue

        -- if add fails as queue is full we return false and the event will continue processing, we risk re-order
        -- but not losing it
        return add_item_to_queue(room.join_rate_presence_queue, event, room, stanza.attr.from);
    end

end, 9); -- as we will rate limit joins we need to be the first to execute
         -- we ran it after muc_max_occupants which is with priority 10, there is nothing to rate limit
         -- if max number of occupants is reached

-- clear queue on room destroy so timer will skip next run if any
module:hook('muc-room-destroyed',function(event)
    event.room.join_rate_presence_queue = nil;
end);
