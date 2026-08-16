-- Unit tests for luajwtjitsi.lib.lua
-- Run with busted from resources/prosody-plugins/:
--   busted spec/lua/
-- Requires: basexx, lua-cjson, openssl (luarocks package 'openssl')

-- Compatibility shim: the luarocks 'openssl' package (v0.11+) has a different
-- API from the old 'lua-openssl' that the production code was written for.
-- Differences handled here:
--   1. require style: monolithic (require 'openssl') vs submodule (require 'openssl.digest')
--   2. hmac.new: old=(key,algo), new=(algo,key)
--   3. digest:update(): old returns self (chainable), new returns bool
--   4. pkey.new(pem): not supported in new API; use pkey.read(pem, private, 'pem')
--   5. pkey:sign(digest_obj): old takes digest obj, new takes (data, algo)
--   6. pkey:verify(sig, digest_obj): old order; new is verify(data, sig, algo)
local _ok, _ssl = pcall(require, 'openssl')
if _ok and type(_ssl) == 'table' then

    -- 1+2. hmac: swap args and register as submodule
    if not package.preload['openssl.hmac'] then
        local _hmac_raw = _ssl.hmac
        local _hmac_compat = setmetatable({}, { __index = _hmac_raw })
        _hmac_compat.new = function(key, algo) return _hmac_raw.new(algo, key) end
        package.preload['openssl.hmac'] = function() return _hmac_compat end
    end

    -- 1+3. digest: make :update() return self, store data+algo for pkey compat
    if not package.preload['openssl.digest'] then
        local _digest_raw = _ssl.digest
        local _digest_compat = {}
        _digest_compat.new = function(algo)
            local inner = _digest_raw.new(algo)
            local w = { _inner = inner, _algo = algo, _data = '' }
            return setmetatable(w, {
                __index = function(self, k)
                    if k == 'update' then
                        return function(s, d)
                            s._inner:update(d)
                            s._data = s._data .. d
                            return s  -- return self for chaining (old API)
                        end
                    elseif k == 'final' then
                        return function(s) return s._inner:final() end
                    end
                end
            })
        end
        package.preload['openssl.digest'] = function() return _digest_compat end
    end

    -- 1+4+5+6. pkey: map new() to read(), adapt sign/verify signatures
    if not package.preload['openssl.pkey'] then
        local _pkey_raw = _ssl.pkey
        local function wrap_key(raw)
            return setmetatable({}, {
                __index = function(_, k)
                    if k == 'sign' then
                        -- old: sign(digest_obj)  →  new: sign(data, algo)
                        return function(_, dobj)
                            return raw:sign(dobj._data, dobj._algo)
                        end
                    elseif k == 'verify' then
                        -- old: verify(sig, digest_obj)  →  new: verify(data, sig, algo)
                        return function(_, sig, dobj)
                            return raw:verify(dobj._data, sig, dobj._algo)
                        end
                    else
                        return raw[k]
                    end
                end
            })
        end
        local _pkey_compat = setmetatable({}, { __index = _pkey_raw })
        _pkey_compat.new = function(pem)
            local ok1, k1 = pcall(_pkey_raw.read, pem, true,  'pem')  -- private
            if ok1 and k1 then return wrap_key(k1) end
            local ok2, k2 = pcall(_pkey_raw.read, pem, false, 'pem')  -- public
            if ok2 and k2 then return wrap_key(k2) end
            return nil  -- signal invalid key (matches old API behaviour)
        end
        package.preload['openssl.pkey'] = function() return _pkey_compat end
    end

end

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

-- Test RSA key pair (1024-bit PKCS#1, test use only — not for production).
-- Generated with: openssl genrsa -traditional 1024
local PRIVATE_PEM = [[
-----BEGIN RSA PRIVATE KEY-----
MIICXQIBAAKBgQDElXxE6H6t622jPZbwgXi+WuJpLDIPr2znPUqtzTJCAVnK1+Iw
CoTjKYmtkiaszVCn/QL41Hr1JXHA/zzo/dLedvKQhs6dvadUVt4Ch2D7hcqGzn7T
oCTCzD1CyaIb9jGR0KOh8gMpL7JE6Zk9f1ku+91QPTe55FlyHPJ4fZfh/wIDAQAB
AoGBAK6uUlV87owmxi6m3MfrlFo5sjRYhEdxz2iPCxvzWTRTtPFM8f1Ua47bay6j
zuAANSqA5bIsRPIvCqy/YOV8HnHnNVl1ARCEAWMl2it0BsqOxuJKhqUsbp1gPAtM
mJE51yPwfN8fcvMNw+6dwV0h3jp+Y57RR0JAhMRWZNrBSmPhAkEA4smEZX8tjQzB
W3FoPIz5a8hgTDfyHYZftC6HqTdEx/NK1z2+EkirS/4WAcMkIb63gWtxSs/9H+bE
tEKcIGzJsQJBAN3n/iLa+2SIseykvzD5bJrdqdmpFYTMzzs8mua5ngkVGd5hkhJ1
MhhfRe3B/ytBLsd74A889k6vFUxoIYMYoq8CQDinhv+kCckWyqcBabzWquiWIhho
UX+2tenZReKr/+7DhIrIzdbbeI9/ZhgCm+AiOM2H/cFmvCFgEPvHOCGRi8ECQQC3
qIe0j2sbZOtlgWDgBr+1WRp3lDLEK8KkM1+88Al1WOqFHFoKPscMVuYIhtRLF3LB
Fax20CzHKK9HArQhzWTvAkBezAcZyo/TBNq+gHKAQw66mFbr7QSd7BCMIQAZg6Cn
VfvTq/eTsOOIgqKYyQzlSY1Jwu27pVQtRzGPOitHbO3E
-----END RSA PRIVATE KEY-----
]]

local PUBLIC_PEM = [[
-----BEGIN PUBLIC KEY-----
MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDElXxE6H6t622jPZbwgXi+WuJp
LDIPr2znPUqtzTJCAVnK1+IwCoTjKYmtkiaszVCn/QL41Hr1JXHA/zzo/dLedvKQ
hs6dvadUVt4Ch2D7hcqGzn7ToCTCzD1CyaIb9jGR0KOh8gMpL7JE6Zk9f1ku+91Q
PTe55FlyHPJ4fZfh/wIDAQAB
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

describe("luajwtjitsi", function()

    describe("internals", function()

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

            it("returns error or throws for token with invalid base64 header", function()
                -- Older basexx returns garbage bytes (decode attempt fails gracefully);
                -- newer basexx returns nil causing cjson.decode to throw.  Both are
                -- acceptable outcomes — just verify we never get a valid header back.
                local ok, h = pcall(I.parse_token, "!!!!.body.sig")
                if ok then
                    assert.is_nil(h)  -- graceful nil-return path
                end
                -- if not ok: threw an error, which is also acceptable
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

    end) -- internals

    describe("encode", function()

        describe("argument validation", function()
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

    end) -- encode

    describe("verify", function()

        describe("argument validation", function()
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

        describe("HS256", function()
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
                local basexx = require 'basexx'
                local parts = I.split_token(tok)
                parts[2] = basexx.to_url64('{"sub":"hacker","exp":9999999999}')
                local body, err = M.verify(table.concat(parts, '.'), 'HS256', 'secret')
                assert.is_nil(body)
                assert.is_string(err)
            end)
        end)

        describe("HS384", function()
            it("encode then verify returns original payload", function()
                local tok = assert(M.encode(payload(), 'secret', 'HS384'))
                local body = assert(M.verify(tok, 'HS384', 'secret'))
                assert.equal('test', body.sub)
            end)
        end)

        describe("HS512", function()
            it("encode then verify returns original payload", function()
                local tok = assert(M.encode(payload(), 'secret', 'HS512'))
                local body = assert(M.verify(tok, 'HS512', 'secret'))
                assert.equal('test', body.sub)
            end)
        end)

        describe("RS256", function()
            it("encode with private key, verify with public key", function()
                local tok = assert(M.encode(payload(), PRIVATE_PEM, 'RS256'))
                local body = assert(M.verify(tok, 'RS256', PUBLIC_PEM))
                assert.equal('test', body.sub)
            end)

            it("tampered signature fails verification", function()
                local tok = assert(M.encode(payload(), PRIVATE_PEM, 'RS256'))
                -- Corrupt the middle of the signature segment so the decoded bytes change.
                -- (Avoid the last 1-2 chars: they may carry padding bits that decode identically.)
                local mid = math.floor(#tok / 2)
                local c = tok:sub(mid, mid)
                local replacement = (c == 'A') and 'B' or 'A'
                local tampered = tok:sub(1, mid - 1) .. replacement .. tok:sub(mid + 1)
                local body, err = M.verify(tampered, 'RS256', PUBLIC_PEM)
                assert.is_nil(body)
                assert.is_string(err)
            end)
        end)

        describe("claims", function()
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

        describe("issuer", function()
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

            it("wildcard matches any value", function()
                local tok = assert(M.encode(payload({ iss = 'anyone' }), 'secret', 'HS256'))
                local body = assert(M.verify(tok, 'HS256', 'secret', { '*' }))
                assert.equal('anyone', body.iss)
            end)
        end)

        describe("audience", function()
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

            it("wildcard matches any value", function()
                local tok = assert(M.encode(payload({ aud = 'anything' }), 'secret', 'HS256'))
                local body = assert(M.verify(tok, 'HS256', 'secret', nil, { '*' }))
                assert.equal('anything', body.aud)
            end)
        end)

    end) -- verify

end) -- luajwtjitsi
