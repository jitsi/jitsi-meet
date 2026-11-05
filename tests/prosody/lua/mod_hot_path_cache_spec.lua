-- Unit tests for mod_hot_path_cache.lua
-- Run with busted from resources/prosody-plugins/:
--   busted spec/lua/
--
-- util.stanza and util.jid are replaced by small libraries with the same shape as prosody's: the functions
-- the module patches are locals that other functions of the library call.

local ESCAPES = { ["'"] = "&apos;", ["\""] = "&quot;", ["<"] = "&lt;", [">"] = "&gt;", ["&"] = "&amp;" };

local function make_stanza_lib(with_local)
    local escape_calls = 0;
    local function xml_escape(str)
        escape_calls = escape_calls + 1;
        return (string.gsub(str, "['&<>\"]", ESCAPES));
    end
    local stanza_mt = {};
    stanza_mt.__index = stanza_mt;
    if with_local then
        function stanza_mt.__tostring(t)
            return "<" .. t.name .. " v='" .. xml_escape(t.value) .. "'/>";
        end
    else
        function stanza_mt.__tostring(t)
            return "<" .. t.name .. "/>";
        end
    end
    return {
        xml_escape = xml_escape;
        stanza = function (name, value) return setmetatable({ name = name, value = value or "" }, stanza_mt); end;
        escape_calls = function () return escape_calls; end;
    };
end

local function make_jid_lib()
    local match = string.match;
    local split_calls = 0;
    local function split(jid)
        if jid == nil then return; end
        split_calls = split_calls + 1;
        local node, nodepos = match(jid, "^([^@/]+)@()");
        local host, hostpos = match(jid, "^([^@/]+)()", nodepos);
        local resource = host and match(jid, "^/(.+)$", hostpos);
        if (host == nil) or ((resource == nil) and #jid >= hostpos) then return nil, nil, nil; end
        return node, host, resource;
    end
    local function bare(jid)
        local node, host = split(jid);
        if node ~= nil and host ~= nil then
            return node .. "@" .. host;
        end
        return host;
    end
    local function prepped_split(jid)
        return split(jid);
    end
    return {
        split = split;
        bare = bare;
        prepped_split = prepped_split;
        split_calls = function () return split_calls; end;
    };
end

-- Loads the module against fresh libraries and returns them with the module stub.
local function load(options)
    options = options or {};
    local stanza_lib = make_stanza_lib(options.without_escape_local ~= true);
    local jid_lib = make_jid_lib();
    package.loaded['util.stanza'] = stanza_lib;
    package.loaded['util.jid'] = jid_lib;

    local logs = {};
    local mod = {
        set_global = function () end;
        get_option_number = function (_, key, default)
            if key == 'hot_path_cache_size' and options.cache_size then
                return options.cache_size;
            end
            return default;
        end;
        get_option_boolean = function (_, key, default)
            if key == 'hot_path_cache_enabled' then
                return options.enabled ~= false;
            end
            return default;
        end;
        log = function (_, level, message) table.insert(logs, level .. ' ' .. message); end;
    };
    _G.module = mod;
    dofile("mod_hot_path_cache.lua");
    return stanza_lib, jid_lib, mod, logs;
end

local function parts(...)
    return { n = select('#', ...), ... };
end

describe("mod_hot_path_cache", function ()

    describe("xml_escape", function ()
        it("escapes a value once however often it is serialised", function ()
            local stanza_lib = load();
            local s = stanza_lib.stanza("presence", "a<b & 'c'");
            local first = tostring(s);
            for _ = 1, 10 do
                assert.equal(first, tostring(s));
            end
            assert.equal("<presence v='a&lt;b &amp; &apos;c&apos;'/>", first);
            assert.equal(1, stanza_lib.escape_calls());
        end)

        it("gives the same result as the original through the exported field", function ()
            local stanza_lib = load();
            for _, value in ipairs({ "", "plain", "&amp;", "<\"'>", "x&y" }) do
                assert.equal((string.gsub(value, "['&<>\"]", ESCAPES)), stanza_lib.xml_escape(value));
            end
        end)

        it("passes values that are not strings to the original", function ()
            local stanza_lib = load();
            assert.equal("42", stanza_lib.xml_escape(42));
            assert.equal("42", stanza_lib.xml_escape(42));
            assert.equal(2, stanza_lib.escape_calls());
        end)

        it("does not keep long strings", function ()
            local stanza_lib = load();
            local long = string.rep("<", 300);
            stanza_lib.xml_escape(long);
            stanza_lib.xml_escape(long);
            assert.equal(2, stanza_lib.escape_calls());
        end)

        it("leaves the library alone and warns when the local is missing", function ()
            local stanza_lib, _, _, logs = load({ without_escape_local = true });
            assert.equal("<presence/>", tostring(stanza_lib.stanza("presence", "x")));
            assert.equal(0, stanza_lib.escape_calls());
            local warned = false;
            for _, line in ipairs(logs) do
                if line:find("^warn .*xml_escape") then warned = true; end
            end
            assert.is_true(warned);
        end)
    end)

    describe("split", function ()
        it("splits a JID once for every function of the library", function ()
            local _, jid_lib = load();
            local j = "[t]room@conference.example.com/nick";
            for _ = 1, 5 do
                assert.equal("[t]room@conference.example.com", jid_lib.bare(j));
                assert.same(parts("[t]room", "conference.example.com", "nick"), parts(jid_lib.prepped_split(j)));
                assert.same(parts("[t]room", "conference.example.com", "nick"), parts(jid_lib.split(j)));
            end
            assert.equal(1, jid_lib.split_calls());
        end)

        it("keeps the results of the original for valid and invalid JIDs", function ()
            local reference = make_jid_lib();
            local _, jid_lib = load();
            for _, j in ipairs({ "a@b/c", "a@b", "b", "b/r", "", "@", "a@", "/r", "a@b/", "a@b/c/d", "a@@b" }) do
                for _ = 1, 2 do
                    assert.same(parts(reference.split(j)), parts(jid_lib.split(j)));
                end
            end
        end)

        it("returns nothing for nil, like the original", function ()
            local _, jid_lib = load();
            assert.equal(0, select('#', jid_lib.split(nil)));
        end)

        it("starts over when the cache is full", function ()
            local _, jid_lib = load({ cache_size = 2 });
            for _, j in ipairs({ "a@b", "c@d", "e@f", "a@b" }) do
                jid_lib.split(j);
            end
            assert.equal(4, jid_lib.split_calls());
            assert.same(parts("a", "b", nil), parts(jid_lib.split("a@b")));
        end)
    end)

    it("leaves both libraries alone unless hot_path_cache_enabled is set", function ()
        local stanza_lib, jid_lib = load({ enabled = false });
        local s = stanza_lib.stanza("presence", "<x>");
        tostring(s);
        tostring(s);
        jid_lib.bare("a@b/c");
        jid_lib.bare("a@b/c");
        assert.equal(2, stanza_lib.escape_calls());
        assert.equal(2, jid_lib.split_calls());
    end)

    it("puts the originals back when unloaded", function ()
        local stanza_lib, jid_lib, mod = load();
        local s = stanza_lib.stanza("presence", "<x>");
        tostring(s);
        jid_lib.bare("a@b/c");
        mod.unload();
        tostring(s);
        tostring(s);
        jid_lib.bare("a@b/c");
        jid_lib.bare("a@b/c");
        assert.equal(3, stanza_lib.escape_calls());
        assert.equal(3, jid_lib.split_calls());
    end)
end)
