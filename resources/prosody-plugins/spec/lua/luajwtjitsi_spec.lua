-- Unit tests for luajwtjitsi.lib.lua
-- Run with busted from resources/prosody-plugins/:
--   busted spec/lua/
-- Requires: basexx, lua-cjson, lua-openssl

-- Guard: skip the whole suite if the module's hard dependencies aren't installed.
local ok, M = pcall(dofile, "luajwtjitsi.lib.lua")
if not ok then
    describe("luajwtjitsi", function()
        it("skipped — missing dependencies (lua-cjson and/or lua-openssl not installed)", function()
            pending(tostring(M):match("([^\n]+)"))
        end)
    end)
    return
end

local I = M._internals

-- Test RSA key pair (1024-bit, test use only — not for production).
-- Generated with: openssl genrsa 1024 | openssl pkcs8 -topk8 -nocrypt
local PRIVATE_PEM = [[
-----BEGIN PRIVATE KEY-----
MIICdwIBADANBgkqhkiG9w0BAQEFAASCAmEwggJdAgEAAoGBAM1FvaawYWUCYDY5
LRTPwwJL0nyMBql/6leKzQgFIVi4KPj9UeeI9+N6/2zWv6wNuCoo9FmfMDurxBEd
LMjGz4Pj++toN7rfG4xHa3C/7ERlZLMJ0YzwZvhWBTqA1tohOYzaUzdf1PsLUWhA
/4Gl3xew8jkuF7qJNREnkcK9+HP3AgMBAAECgYBaHlgYqi7YDab3pzpnfJ78jxUl
oMP7/jB/pmxFLRtqu88hIPWoVLWfpQwmWFFl09AakkhUYFLon4xAhzJ2IvJPB6hZ
OYlf4hXxE5VidMOT29mhtgrQr3KnrT1eDeVqyFTPjW/6TMF5Amd0/5FHCiQKPf/v
GyTvzM6KQo2ECvS/gQJBAOf69FuS9haSwCjNwxC+wgG00mMUI6vsoQR+FT6Bx+pm
dt0Cgqsco+cQ9F4mlaFdmzE6RjimznmxRrXjrmkVu9ECQQDihtjsYDWb41idr713
mnsZOBpPbruRQHGVvrVDcLf6QPQoqxJWTSmokmL0MfIAfgfaEAZdFEpSy4NleX1a
m81HAkEA3tAAklBGg4nyfX6cpGHEb+Ugyj9Wv9QpF+qONxpqTS6bbk3x+a4pk0+K
lz/SKkqBPDgvqEw3N1VZiGymYZKZcQJBAID1HXbrinlVYrRaQLVfF2cS/j9sHZGi
K0eBSvW6rLHl2llwkj7ZLLcPpw+3gzpuhQ/KAaVpkKozu3jAQfGcMq8CQFn/DIcJ
Cy6VLWW6aI46Yj6NgkibjG+fLW8EI73uxGCAEdJEN9WTrV3XhOvfUxXdCoDZXceA
G64VSTBaYuaVmSI=
-----END PRIVATE KEY-----
]]

local PUBLIC_PEM = [[
-----BEGIN PUBLIC KEY-----
MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDNRb2msGFlAmA2OS0Uz8MCS9J8
jAapf+pXis0IBSFYuCj4/VHniPfjev9s1r+sDbgqKPRZnzA7q8QRHSzIxs+D4/vr
aDe63xuMR2twv+xEZWSzCdGM8Gb4VgU6gNbaITmM2lM3X9T7C1FoQP+Bpd8XsPI5
Lhe6iTURJ5HCvfhz9wIDAQAB
-----END PUBLIC KEY-----
]]

-- Returns a payload with exp set one hour in the future (so verify's exp check passes).
-- Extra fields can be merged in via the `extra` table.
local function payload(extra)
    local p = { sub = 'test', exp = os.time() + 3600 }
    if extra then
        for k, v in pairs(extra) do p[k] = v end
    end
    return p
end

-- ---------------------------------------------------------------------------
-- verify_claim
-- ---------------------------------------------------------------------------
describe("verify_claim", function()
    it("exact match returns true", function()
        assert.is_true(I.verify_claim('foo', { 'foo', 'bar' }))
    end)

    it("non-matching value returns false", function()
        assert.is_false(I.verify_claim('baz', { 'foo', 'bar' }))
    end)

    it("wildcard '*' matches any value", function()
        assert.is_true(I.verify_claim('anything', { '*' }))
    end)

    it("empty list returns false", function()
        assert.is_false(I.verify_claim('foo', {}))
    end)

    it("wildcard in mixed list still matches", function()
        assert.is_true(I.verify_claim('x', { 'a', '*', 'b' }))
    end)
end)

-- ---------------------------------------------------------------------------
-- split_token
-- ---------------------------------------------------------------------------
describe("split_token", function()
    it("splits three segments correctly", function()
        local parts = I.split_token("aaa.bbb.ccc")
        assert.equal(3, #parts)
        assert.equal('aaa', parts[1])
        assert.equal('bbb', parts[2])
        assert.equal('ccc', parts[3])
    end)

    it("returns one element when there are no dots", function()
        local parts = I.split_token("nodots")
        assert.equal(1, #parts)
        assert.equal('nodots', parts[1])
    end)

    it("returns two elements for two segments", function()
        local parts = I.split_token("hdr.body")
        assert.equal(2, #parts)
    end)
end)

-- ---------------------------------------------------------------------------
-- strip_signature
-- ---------------------------------------------------------------------------
describe("strip_signature", function()
    it("removes the signature segment", function()
        local result = I.strip_signature("hdr.body.sig")
        assert.equal("hdr.body", result)
    end)

    it("returns nil and error for two-segment input", function()
        local result, _, _, err = I.strip_signature("hdr.body")
        assert.is_nil(result)
        assert.is_string(err)
    end)

    it("returns nil and error for single-segment input", function()
        local result, _, _, err = I.strip_signature("nodots")
        assert.is_nil(result)
        assert.is_string(err)
    end)
end)

-- ---------------------------------------------------------------------------
-- parse_token
-- ---------------------------------------------------------------------------
describe("parse_token", function()
    it("parses a valid HS256 token into header, body, and signature", function()
        local tok = assert(M.encode({ sub = 'alice', exp = os.time() + 3600 }, 'secret', 'HS256'))
        local header, body, sig = I.parse_token(tok)
        assert.is_table(header)
        assert.is_table(body)
        assert.is_string(sig)
        assert.equal('JWT',   header.typ)
        assert.equal('HS256', header.alg)
        assert.equal('alice', body.sub)
    end)

    it("returns error for token with only two segments", function()
        local h, b, s, err = I.parse_token("hdr.body")
        assert.is_nil(h)
        assert.is_string(err)
    end)

    it("returns error for token with invalid base64 header", function()
        -- '!!!!' is not valid base64; cjson.decode will fail on the garbage bytes
        local h, b, s, err = I.parse_token("!!!!.body.sig")
        assert.is_nil(h)
        assert.is_string(err)
    end)

    it("returns error for token with invalid JSON body", function()
        local basexx = require 'basexx'
        local good_hdr = basexx.to_url64('{"typ":"JWT","alg":"HS256"}')
        local bad_body = basexx.to_url64('not-valid-json{{')
        local h, b, s, err = I.parse_token(good_hdr .. '.' .. bad_body .. '.sig')
        assert.is_nil(h)
        assert.is_string(err)
    end)
end)

-- ---------------------------------------------------------------------------
-- M.encode / M.verify — argument validation
-- ---------------------------------------------------------------------------
describe("M.encode argument validation", function()
    it("non-table data returns error", function()
        local tok, err = M.encode("not-a-table", "key", "HS256")
        assert.is_nil(tok)
        assert.is_string(err)
    end)

    it("non-string key returns error", function()
        local tok, err = M.encode({}, 123, "HS256")
        assert.is_nil(tok)
        assert.is_string(err)
    end)

    it("unsupported algorithm returns error", function()
        local tok, err = M.encode({}, "key", "XX999")
        assert.is_nil(tok)
        assert.is_string(err)
    end)
end)

describe("M.verify argument validation", function()
    it("non-string token returns error", function()
        local body, err = M.verify(123, "HS256", "key")
        assert.is_nil(body)
        assert.is_string(err)
    end)

    it("non-string algorithm returns error", function()
        local body, err = M.verify("a.b.c", 42, "key")
        assert.is_nil(body)
        assert.is_string(err)
    end)

    it("unsupported algorithm returns error", function()
        local body, err = M.verify("a.b.c", "XX999", "key")
        assert.is_nil(body)
        assert.is_string(err)
    end)

    it("malformed token (two segments) returns error", function()
        local body, err = M.verify("hdr.body", "HS256", "key")
        assert.is_nil(body)
        assert.is_string(err)
    end)
end)

-- ---------------------------------------------------------------------------
-- HS* roundtrips
-- ---------------------------------------------------------------------------
describe("HS256 roundtrip", function()
    it("encode then verify returns original payload", function()
        local tok = assert(M.encode(payload({ iss = 'me' }), 'my-secret', 'HS256'))
        local body = assert(M.verify(tok, 'HS256', 'my-secret'))
        assert.equal('test', body.sub)
        assert.equal('me',   body.iss)
    end)

    it("wrong key fails verification", function()
        local tok = assert(M.encode(payload(), 'correct', 'HS256'))
        local body, err = M.verify(tok, 'HS256', 'wrong')
        assert.is_nil(body)
        assert.is_string(err)
    end)

    it("tampered payload fails verification", function()
        local tok = assert(M.encode(payload(), 'secret', 'HS256'))
        -- Replace the body segment with a freshly-encoded different payload
        local basexx = require 'basexx'
        local parts = I.split_token(tok)
        parts[2] = basexx.to_url64('{"sub":"hacker","exp":9999999999}')
        local tampered = table.concat(parts, '.')
        local body, err = M.verify(tampered, 'HS256', 'secret')
        assert.is_nil(body)
        assert.is_string(err)
    end)
end)

describe("HS384 roundtrip", function()
    it("encode then verify returns original payload", function()
        local tok = assert(M.encode(payload(), 'secret', 'HS384'))
        local body = assert(M.verify(tok, 'HS384', 'secret'))
        assert.equal('test', body.sub)
    end)
end)

describe("HS512 roundtrip", function()
    it("encode then verify returns original payload", function()
        local tok = assert(M.encode(payload(), 'secret', 'HS512'))
        local body = assert(M.verify(tok, 'HS512', 'secret'))
        assert.equal('test', body.sub)
    end)
end)

-- ---------------------------------------------------------------------------
-- RS256 roundtrip
-- ---------------------------------------------------------------------------
describe("RS256 roundtrip", function()
    it("encode with private key, verify with public key", function()
        local tok = assert(M.encode(payload(), PRIVATE_PEM, 'RS256'))
        local body = assert(M.verify(tok, 'RS256', PUBLIC_PEM))
        assert.equal('test', body.sub)
    end)

    it("tampered signature fails verification", function()
        local tok = assert(M.encode(payload(), PRIVATE_PEM, 'RS256'))
        -- Flip the last character of the signature segment
        local flipped = tok:sub(-1) == 'A' and 'B' or 'A'
        local body, err = M.verify(tok:sub(1, -2) .. flipped, 'RS256', PUBLIC_PEM)
        assert.is_nil(body)
        assert.is_string(err)
    end)
end)

-- ---------------------------------------------------------------------------
-- Claims validation
-- ---------------------------------------------------------------------------
describe("claims validation", function()
    it("expired token is rejected", function()
        local tok = assert(M.encode({ sub = 'test', exp = os.time() - 1 }, 'secret', 'HS256'))
        local body, err = M.verify(tok, 'HS256', 'secret')
        assert.is_nil(body)
        assert.truthy(err:match('exp'))
    end)

    it("nbf in the future is rejected", function()
        local tok = assert(M.encode(
            { sub = 'test', exp = os.time() + 3600, nbf = os.time() + 9999 },
            'secret', 'HS256'
        ))
        local body, err = M.verify(tok, 'HS256', 'secret')
        assert.is_nil(body)
        assert.truthy(err:match('nbf'))
    end)

    it("alg mismatch between header and expectedAlgo is rejected", function()
        local tok = assert(M.encode(payload(), 'secret', 'HS256'))
        local body, err = M.verify(tok, 'HS512', 'secret')
        assert.is_nil(body)
        assert.is_string(err)
    end)
end)

-- ---------------------------------------------------------------------------
-- Issuer and audience validation
-- ---------------------------------------------------------------------------
describe("issuer validation", function()
    it("accepted issuer passes", function()
        local tok = assert(M.encode(payload({ iss = 'jitsi' }), 'secret', 'HS256'))
        local body = assert(M.verify(tok, 'HS256', 'secret', { 'jitsi' }))
        assert.equal('jitsi', body.iss)
    end)

    it("wrong issuer is rejected", function()
        local tok = assert(M.encode(payload({ iss = 'evil' }), 'secret', 'HS256'))
        local body, err = M.verify(tok, 'HS256', 'secret', { 'jitsi' })
        assert.is_nil(body)
        assert.is_string(err)
    end)

    it("missing iss claim when acceptedIssuers provided is rejected", function()
        local tok = assert(M.encode(payload(), 'secret', 'HS256'))
        local body, err = M.verify(tok, 'HS256', 'secret', { 'jitsi' })
        assert.is_nil(body)
        assert.is_string(err)
    end)

    it("wildcard issuer matches any value", function()
        local tok = assert(M.encode(payload({ iss = 'anyone' }), 'secret', 'HS256'))
        local body = assert(M.verify(tok, 'HS256', 'secret', { '*' }))
        assert.equal('anyone', body.iss)
    end)
end)

describe("audience validation", function()
    it("accepted audience passes", function()
        local tok = assert(M.encode(payload({ aud = 'jitsi' }), 'secret', 'HS256'))
        local body = assert(M.verify(tok, 'HS256', 'secret', nil, { 'jitsi' }))
        assert.equal('jitsi', body.aud)
    end)

    it("wrong audience is rejected", function()
        local tok = assert(M.encode(payload({ aud = 'wrong' }), 'secret', 'HS256'))
        local body, err = M.verify(tok, 'HS256', 'secret', nil, { 'jitsi' })
        assert.is_nil(body)
        assert.is_string(err)
    end)

    it("missing aud claim when acceptedAudiences provided is rejected", function()
        local tok = assert(M.encode(payload(), 'secret', 'HS256'))
        local body, err = M.verify(tok, 'HS256', 'secret', nil, { 'jitsi' })
        assert.is_nil(body)
        assert.is_string(err)
    end)

    it("wildcard audience matches any value", function()
        local tok = assert(M.encode(payload({ aud = 'anything' }), 'secret', 'HS256'))
        local body = assert(M.verify(tok, 'HS256', 'secret', nil, { '*' }))
        assert.equal('anything', body.aud)
    end)
end)
