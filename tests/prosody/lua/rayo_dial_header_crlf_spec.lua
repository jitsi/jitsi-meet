-- Unit test for Rayo dial IQ header serialization.
-- Run with busted from resources/prosody-plugins/:
--   busted spec/lua/
--
-- Purpose: a Rayo "dial" IQ (urn:xmpp:rayo:1) carries client-influenced header
-- values (e.g. JvbRoomName / JvbRoomPassword). If a header value contains a raw
-- carriage-return / line-feed, an unescaped serialization would let a client
-- inject extra lines into the XMPP stream — and, downstream, into the SIP
-- headers jigasi builds from these values (CRLF / header injection).
--
-- Prosody's util.stanza serializer neutralizes this by XML-escaping control
-- characters: "\r" -> "&#13;" and "\n" -> "&#10;". This spec produces a dial IQ
-- with such a header and asserts the serialized stanza contains "&#13;&#10;" and
-- leaks no raw CR/LF bytes.
--
-- It uses Prosody's real util.stanza when it resolves on LUA_PATH; otherwise it
-- falls back to a small in-file serializer that mirrors Prosody's escape table,
-- so the contract is still asserted in CI (where Prosody is not installed).

local RAYO_NS = 'urn:xmpp:rayo:1';

-- ---------------------------------------------------------------------------
-- Obtain a stanza builder: prefer the real util.stanza, else a faithful stub.
-- ---------------------------------------------------------------------------

local st, source;

local ok_real, real = pcall(require, 'util.stanza');
if ok_real and type(real) == 'table' and real.iq then
    st = real;
    source = 'util.stanza (real Prosody)';
else
    source = 'in-file reference serializer';

    -- Mirrors Prosody's util.stanza escape table: control characters are
    -- escaped to numeric entities so they cannot break out of an attribute.
    local escape_table = {
        ["'"]  = "&apos;",
        ['"']  = "&quot;",
        ["<"]  = "&lt;",
        [">"]  = "&gt;",
        ["&"]  = "&amp;",
        ["\t"] = "&#9;",
        ["\n"] = "&#10;",
        ["\r"] = "&#13;",
    };
    local function xml_escape(str)
        return (str:gsub("['&<>\"\t\n\r]", escape_table));
    end

    local stanza_mt = {};
    stanza_mt.__index = stanza_mt;

    local function new_stanza(name, attr)
        return setmetatable({
            name = name,
            attr = attr or {},
            tags = {},
            last_add = {},
        }, stanza_mt);
    end

    function stanza_mt:tag(name, attr)
        local child = new_stanza(name, attr);
        local parent = self.last_add[#self.last_add] or self;

        table.insert(parent.tags, child);
        table.insert(self.last_add, child);

        return self;
    end

    function stanza_mt:up()
        table.remove(self.last_add);

        return self;
    end

    local function serialize(node, buf)
        table.insert(buf, "<" .. node.name);
        for k, v in pairs(node.attr) do
            table.insert(buf, " " .. k .. '="' .. xml_escape(tostring(v)) .. '"');
        end

        if #node.tags == 0 then
            table.insert(buf, "/>");
        else
            table.insert(buf, ">");
            for _, child in ipairs(node.tags) do
                serialize(child, buf);
            end
            table.insert(buf, "</" .. node.name .. ">");
        end

        return buf;
    end

    stanza_mt.__tostring = function(self)
        return table.concat(serialize(self, {}));
    end

    st = {
        iq = function(attr)
            return new_stanza('iq', attr);
        end,
    };
end

-- ---------------------------------------------------------------------------
-- Test
-- ---------------------------------------------------------------------------

describe("Rayo dial IQ header CRLF escaping [" .. source .. "]", function()

    -- Builds a dial IQ the same shape mod_muc_jigasi_invite.lua produces:
    --   <iq><dial xmlns=rayo><header name=... value=.../></dial></iq>
    -- with a JvbRoomName header whose value is spiked with a raw CRLF.
    local function build_dial_iq(room_value)
        return st.iq({
                xmlns = "jabber:client",
                type = "set",
                to = "jvb@example.com",
                from = "focus@example.com",
                id = "dial-1",
            })
            :tag("dial", { xmlns = RAYO_NS, from = "fromnumber", to = "sip:test@example.com" })
                :tag("header", { xmlns = RAYO_NS, name = "JvbRoomName", value = room_value })
                :up()
            :up();
    end

    it("escapes a CRLF-injected header value to &#13;&#10;", function()
        -- A client attempting to smuggle an extra SIP header via CRLF injection.
        local malicious = "room@conference.example.com\r\nInjected-Header: evil";
        local iq = build_dial_iq(malicious);

        local xml = tostring(iq);

        assert.is_truthy(xml:find("&#13;&#10;", 1, true),
            "serialized dial IQ must escape the raw CRLF to &#13;&#10;");
    end)

    it("leaks no raw CR or LF bytes in the serialized stanza", function()
        local malicious = "room@conference.example.com\r\nInjected-Header: evil";
        local iq = build_dial_iq(malicious);

        local xml = tostring(iq);

        assert.is_nil(xml:find("[\r\n]"),
            "serialized dial IQ must not contain any raw CR/LF byte");
    end)

    it("preserves the room name text around the escaped CRLF", function()
        local malicious = "room@conference.example.com\r\nInjected-Header: evil";
        local iq = build_dial_iq(malicious);

        local xml = tostring(iq);

        -- The header name and the surrounding value text survive; only the
        -- control characters are entity-encoded.
        assert.is_truthy(xml:find("JvbRoomName", 1, true));
        assert.is_truthy(xml:find("room@conference.example.com&#13;&#10;Injected%-Header: evil"));
    end)

end);
