-- Unit tests for token/jwk.lib.lua
-- Run with busted from resources/prosody-plugins/:
--   busted spec/lua/
-- Requires: basexx  (luarocks install basexx)

-- dofile resolves relative to CWD, so run from resources/prosody-plugins/.
-- The module sets ASN1, base64_encode, and base64url_decode as globals.
local M = dofile("token/jwk.lib.lua")
local ASN1 = M.ASN1

describe("jwk.lib", function()

    describe("ASN1", function()

        describe("encode_length", function()
            it("encodes single-byte length for 0", function()
                assert.equal(string.char(0x00), ASN1.encode_length(0))
            end)

            it("encodes single-byte length for 127", function()
                assert.equal(string.char(0x7F), ASN1.encode_length(127))
            end)

            it("encodes two-byte form for 128", function()
                assert.equal(string.char(0x81, 0x80), ASN1.encode_length(128))
            end)

            it("encodes two-byte form for 255", function()
                assert.equal(string.char(0x81, 0xFF), ASN1.encode_length(255))
            end)

            it("encodes three-byte form for 256", function()
                assert.equal(string.char(0x82, 0x01, 0x00), ASN1.encode_length(256))
            end)

            it("encodes three-byte form for 65535", function()
                assert.equal(string.char(0x82, 0xFF, 0xFF), ASN1.encode_length(65535))
            end)
        end)

        describe("encode_null", function()
            it("returns NULL tag (0x05) with zero length", function()
                assert.equal(string.char(0x05, 0x00), ASN1.encode_null())
            end)
        end)

        describe("encode_integer", function()
            it("tags with 0x02 and does not pad when high bit is clear", function()
                assert.equal(string.char(0x02, 0x01, 0x7F), ASN1.encode_integer(string.char(0x7F)))
            end)

            it("prepends 0x00 when high bit is set to indicate positive number", function()
                assert.equal(string.char(0x02, 0x02, 0x00, 0x80), ASN1.encode_integer(string.char(0x80)))
            end)

            it("prepends 0x00 when first byte is 0xFF", function()
                assert.equal(string.char(0x02, 0x02, 0x00, 0xFF), ASN1.encode_integer(string.char(0xFF)))
            end)

            it("handles multi-byte integer without high bit", function()
                assert.equal(string.char(0x02, 0x02, 0x01, 0x00), ASN1.encode_integer(string.char(0x01, 0x00)))
            end)
        end)

        describe("encode_sequence", function()
            it("wraps content with SEQUENCE tag 0x30", function()
                assert.equal(string.char(0x30, 0x02, 0xAB, 0xCD), ASN1.encode_sequence(string.char(0xAB, 0xCD)))
            end)

            it("handles empty content", function()
                assert.equal(string.char(0x30, 0x00), ASN1.encode_sequence(""))
            end)
        end)

        describe("encode_bit_string", function()
            it("wraps with BIT STRING tag (0x03) and prepends unused-bits byte (0x00)", function()
                -- tag=0x03, length=2 (0x00 + one content byte), 0x00 unused bits, 0xAB
                assert.equal(string.char(0x03, 0x02, 0x00, 0xAB), ASN1.encode_bit_string(string.char(0xAB)))
            end)
        end)

        describe("encode_oid", function()
            it("wraps bytes with OID tag 0x06", function()
                local oid_bytes = string.char(0x2A, 0x86, 0x48)
                assert.equal(string.char(0x06, 0x03) .. oid_bytes, ASN1.encode_oid(oid_bytes))
            end)
        end)

        describe("der_to_pem", function()
            it("wraps DER bytes in PEM format with default PUBLIC KEY label", function()
                local der = string.char(0x30, 0x00)
                local pem = ASN1.der_to_pem(der)
                assert.truthy(pem:match("^-----BEGIN PUBLIC KEY-----\n"))
                assert.truthy(pem:match("-----END PUBLIC KEY-----\n$"))
            end)

            it("uses custom label when provided", function()
                local der = string.char(0x30, 0x00)
                local pem = ASN1.der_to_pem(der, "RSA PUBLIC KEY")
                assert.truthy(pem:match("^-----BEGIN RSA PUBLIC KEY-----\n"))
                assert.truthy(pem:match("-----END RSA PUBLIC KEY-----\n$"))
            end)

            it("breaks base64 into 64-character lines", function()
                -- 48 bytes of DER = 64 chars of base64 (exactly one line)
                local der = string.rep(string.char(0x00), 48)
                local pem = ASN1.der_to_pem(der)
                -- Should have exactly one data line between the markers
                local data = pem:match("-----BEGIN PUBLIC KEY-----\n(.-)\n-----END PUBLIC KEY-----")
                assert.falsy(data:match("\n"))  -- no newline = single line
                assert.equal(64, #data)
            end)
        end)

    end) -- ASN1

    describe("jwk_to_pem", function()
        -- Test vectors computed independently with Python's cryptography primitives.
        -- n=0x0F (15), e=0x03 (3) — minimal key with no high-bit padding needed.
        it("converts a minimal RSA JWK (no 0x00 padding) to PEM", function()
            local pem = M.jwk_to_pem({ n = "Dw", e = "Aw" })
            local expected = "-----BEGIN PUBLIC KEY-----\n"
                .. "MBowDQYJKoZIhvcNAQEBBQADCQAwBgIBDwIBAw==\n"
                .. "-----END PUBLIC KEY-----\n"
            assert.equal(expected, pem)
        end)

        -- n=0x8001, e=65537 — modulus has high bit set, so ASN.1 must prepend 0x00.
        it("converts a JWK with high-bit modulus (requires 0x00 padding) to PEM", function()
            local pem = M.jwk_to_pem({ n = "gAE", e = "AQAB" })
            local expected = "-----BEGIN PUBLIC KEY-----\n"
                .. "MB4wDQYJKoZIhvcNAQEBBQADDQAwCgIDAIABAgMBAAE=\n"
                .. "-----END PUBLIC KEY-----\n"
            assert.equal(expected, pem)
        end)

        it("output begins and ends with correct PEM markers", function()
            local pem = M.jwk_to_pem({ n = "Dw", e = "Aw" })
            assert.truthy(pem:match("^-----BEGIN PUBLIC KEY-----\n"))
            assert.truthy(pem:match("-----END PUBLIC KEY-----\n$"))
        end)
    end) -- jwk_to_pem

end) -- jwk.lib
