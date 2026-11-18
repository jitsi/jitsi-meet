-- Room claim patterns
-- Copyright (C) 2026-present 8x8, Inc.
--
-- A token can flag its room claim as a pattern (context.room.regex). This
-- library matches such a claim against a room name. It has no dependencies,
-- so that busted can load it with dofile (tests/prosody/lua).

-- matches any character that is special in a Lua pattern
local LUA_PATTERN_SPECIAL_CHARS = '[%^%$%(%)%%%.%[%]%*%+%-%?]';

--- Matches a room name against a room claim pattern.
-- The only special sequence in the pattern is one '.*', which matches any run
-- of characters, including an empty one. Every other character matches
-- literally, and the pattern must match the whole room name. Unlike a Lua
-- pattern, this does not backtrack, so the time it takes is linear in the
-- length of the pattern and the room name.
-- @param pattern the room claim
-- @param room the room name
-- @return true or false, or nil and a reason when the pattern is not supported:
--         it is not a string, it has more than one '.*', or it has another Lua
--         pattern special character
local function match(pattern, room)
    if type(pattern) ~= 'string' then
        return nil, 'not a string';
    end

    local wildcard_start, wildcard_end = string.find(pattern, '.*', 1, true);
    local prefix = wildcard_start and pattern:sub(1, wildcard_start - 1) or pattern;
    local suffix = wildcard_start and pattern:sub(wildcard_end + 1) or '';

    -- this also catches a second '.*'
    if string.find(prefix, LUA_PATTERN_SPECIAL_CHARS) or string.find(suffix, LUA_PATTERN_SPECIAL_CHARS) then
        return nil, 'more than one .* or another special character';
    end

    if not wildcard_start then
        return room == prefix;
    end

    return #room >= #prefix + #suffix
        and room:sub(1, #prefix) == prefix
        and room:sub(#room - #suffix + 1) == suffix;
end

return {
    match = match;
};
