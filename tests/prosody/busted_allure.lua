-- Custom busted output handler that writes Allure-native JSON result files.
-- Produces {uuid}-result.json files in spec/allure-results/ with proper
-- parentSuite/suite/subSuite labels derived from the describe() nesting.
--
-- Usage (run from tests/prosody/):
--   busted --output busted_allure lua/

local io = io
local os = os
local math = math
local string = string
local table = table

return function(options)
    local busted = require 'busted'
    local handler = require 'busted.outputHandlers.base'()

    -- Output directory. When run via npm (from tests/prosody/) the ALLURE_RESULTS_DIR
    -- env var is set to an absolute path so results land in tests/prosody/allure-results/
    -- regardless of busted's CWD (resources/prosody-plugins/).
    local results_dir = os.getenv('ALLURE_RESULTS_DIR') or 'allure-results'
    local test_start_ms = 0
    local current_status = 'passed'
    local current_message = nil
    local current_trace = nil
    local counter = 0
    local passed = 0
    local failed = 0
    local skipped = 0

    math.randomseed(os.time())

    local function now_ms()
        return math.floor(os.time() * 1000)
    end

    local function uuid()
        counter = counter + 1
        return string.format('%08x-%04x-4%03x-%04x-%08x%04x',
            os.time() % 0xffffffff,
            math.random(0, 0xffff),
            math.random(0, 0xfff),
            math.random(0x8000, 0xbfff),
            counter,
            math.random(0, 0xffff)
        )
    end

    local function escape_json(s)
        s = tostring(s or '')
        s = s:gsub('\\', '\\\\')
        s = s:gsub('"',  '\\"')
        s = s:gsub('\n', '\\n')
        s = s:gsub('\r', '\\r')
        s = s:gsub('\t', '\\t')
        return s
    end

    -- Traverse element's parent chain to collect describe() names.
    -- Returns an array like {'luajwtjitsi', 'verify', 'HS256'}.
    local function get_describe_stack(element)
        local stack = {}
        local parent = busted.parent(element)
        while parent and parent.descriptor ~= 'file' do
            table.insert(stack, 1, parent.name)
            parent = busted.parent(parent)
        end
        return stack
    end

    local function write_result(element, allure_status, start_ms, stop_ms, message, trace)
        local stack = get_describe_stack(element)
        local labels = {}

        if stack[1] then
            table.insert(labels, string.format(
                '{"name":"parentSuite","value":"%s"}', escape_json(stack[1])))
        end
        if stack[2] then
            table.insert(labels, string.format(
                '{"name":"suite","value":"%s"}', escape_json(stack[2])))
        end
        if #stack >= 3 then
            local parts = {}
            for i = 3, #stack do parts[#parts + 1] = stack[i] end
            table.insert(labels, string.format(
                '{"name":"subSuite","value":"%s"}', escape_json(table.concat(parts, ' \xe2\x80\xba '))))
        end
        table.insert(labels, '{"name":"framework","value":"busted"}')
        table.insert(labels, '{"name":"language","value":"lua"}')

        local status_block = ''
        if message or trace then
            status_block = string.format(
                ',"statusDetails":{"message":"%s","trace":"%s"}',
                escape_json(message), escape_json(trace))
        end

        local id = uuid()
        local json = string.format(
            '{"uuid":"%s","name":"%s","status":"%s","start":%d,"stop":%d,"labels":[%s]%s}',
            id,
            escape_json(element.name),
            allure_status,
            start_ms,
            stop_ms,
            table.concat(labels, ','),
            status_block
        )

        local f = io.open(results_dir .. '/' .. id .. '-result.json', 'w')
        if f then
            f:write(json)
            f:write('\n')
            f:close()
        end
    end

    handler.testStart = function(element, parent)
        test_start_ms   = now_ms()
        current_status  = 'passed'
        current_message = nil
        current_trace   = nil
        return nil, true
    end

    handler.testEnd = function(element, parent, status)
        local stop_ms = now_ms()
        local allure_status

        if status == 'success' then
            allure_status = 'passed'
            passed = passed + 1
            io.write('.')
        elseif status == 'pending' then
            allure_status = 'skipped'
            skipped = skipped + 1
            local p = handler.pendings[#handler.pendings]
            if p then current_message = p.message end
            io.write('S')
        else
            -- failure or error — current_status set by failureTest/errorTest
            allure_status = current_status
            failed = failed + 1
            io.write('F')
        end
        io.flush()

        write_result(element, allure_status, test_start_ms, stop_ms,
                     current_message, current_trace)
        return nil, true
    end

    handler.failureTest = function(element, parent, message, trace)
        current_status  = 'failed'
        current_message = message
        current_trace   = trace and trace.traceback
        return nil, true
    end

    handler.errorTest = function(element, parent, message, trace)
        current_status  = 'broken'
        current_message = message
        current_trace   = trace and trace.traceback
        return nil, true
    end

    handler.exit = function()
        io.write(string.format('\nLua tests: %d passed, %d failed, %d skipped\n',
            passed, failed, skipped))
        io.flush()
        return nil, true
    end

    busted.subscribe({'test',  'start'}, handler.testStart,   {predicate = handler.cancelOnPending})
    busted.subscribe({'test',  'end'},   handler.testEnd,      {predicate = handler.cancelOnPending})
    busted.subscribe({'error', 'it'},    handler.errorTest)
    busted.subscribe({'failure', 'it'},  handler.failureTest)
    busted.subscribe({'exit'},           handler.exit)

    return handler
end
