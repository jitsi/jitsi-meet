-- A pure Lua stand-in for prosody's util.encodings, which is native code and so not there when the specs
-- run in plain Lua. Only base64 is provided. Like prosody's, encode pads its output and decode expects
-- padded input.
-- Load it with require 'encodings_stub' before the module under test is loaded.

if package.preload['util.encodings'] then
    return
end

local ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
local PAD = string.byte('=')
local values = {}
for i = 1, #ALPHABET do
    values[ALPHABET:byte(i)] = i - 1
end

-- Arithmetic instead of bit operators, so it also runs on the Lua versions busted may be installed for.
local floor = math.floor

local function encode(data)
    local out = {}
    for i = 1, #data, 3 do
        local a, b, c = data:byte(i, i + 2)
        local n = a * 65536 + (b or 0) * 256 + (c or 0)
        local chunk = {}
        for _, divisor in ipairs({ 262144, 4096, 64, 1 }) do
            local v = floor(n / divisor) % 64
            chunk[#chunk + 1] = ALPHABET:sub(v + 1, v + 1)
        end
        if not b then
            chunk[3], chunk[4] = '=', '='
        elseif not c then
            chunk[4] = '='
        end
        out[#out + 1] = table.concat(chunk)
    end
    return table.concat(out)
end

local function decode(data)
    local out = {}
    for i = 1, #data - 3, 4 do
        local n, pad = 0, 0
        for j = i, i + 3 do
            local byte = data:byte(j)
            local v
            if byte == PAD then
                v, pad = 0, pad + 1
            else
                v = values[byte]
            end
            if v == nil then
                return nil
            end
            n = n * 64 + v
        end
        local bytes = string.char(floor(n / 65536) % 256, floor(n / 256) % 256, n % 256)
        out[#out + 1] = bytes:sub(1, 3 - pad)
    end
    return table.concat(out)
end

package.preload['util.encodings'] = function()
    return { base64 = { encode = encode, decode = decode } }
end
