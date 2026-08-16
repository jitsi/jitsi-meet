-- Minimal inspect stub for test Docker image.
-- Several Jitsi Prosody plugins require('inspect') for debug logging only.
-- This stub satisfies the require without pulling in the full library.
return function(val, _opts)
    if type(val) ~= 'table' then return tostring(val) end
    local parts = {}
    for k, v in pairs(val) do
        parts[#parts + 1] = tostring(k) .. '=' .. tostring(v)
    end
    return '{' .. table.concat(parts, ', ') .. '}'
end
