local basexx = require "basexx";

local M = {}

-- Helper function to encode bytes to base64
function base64_encode(bytes)
    return basexx.to_base64(bytes)
end

-- Pure Lua ASN.1 DER encoder (no external dependencies)
local ASN1 = {}

-- Encode ASN.1 length field
function ASN1.encode_length(len)
    if len < 128 then
        return string.char(len)
    elseif len < 256 then
        return string.char(0x81, len)
    elseif len < 65536 then
        return string.char(0x82, math.floor(len / 256), len % 256)
    else
        local b1 = math.floor(len / 65536)
        local b2 = math.floor((len % 65536) / 256)
        local b3 = len % 256
        return string.char(0x83, b1, b2, b3)
    end
end

-- Encode ASN.1 INTEGER
function ASN1.encode_integer(bytes)
    -- ASN.1 INTEGER tag is 0x02
    -- If the high bit is set, prepend 0x00 to indicate positive number
    if bytes:byte(1) >= 0x80 then
        bytes = string.char(0x00) .. bytes
    end
    return string.char(0x02) .. ASN1.encode_length(#bytes) .. bytes
end

-- Encode ASN.1 SEQUENCE
function ASN1.encode_sequence(content)
    -- ASN.1 SEQUENCE tag is 0x30
    return string.char(0x30) .. ASN1.encode_length(#content) .. content
end

-- Encode ASN.1 BIT STRING
function ASN1.encode_bit_string(content)
    -- ASN.1 BIT STRING tag is 0x03
    -- First byte indicates number of unused bits (0x00 for byte-aligned)
    return string.char(0x03) .. ASN1.encode_length(#content + 1) .. string.char(0x00) .. content
end

-- Encode ASN.1 OBJECT IDENTIFIER
function ASN1.encode_oid(oid_bytes)
    -- ASN.1 OID tag is 0x06
    return string.char(0x06) .. ASN1.encode_length(#oid_bytes) .. oid_bytes
end

-- Encode ASN.1 NULL
function ASN1.encode_null()
    -- ASN.1 NULL tag is 0x05, length 0
    return string.char(0x05, 0x00)
end

-- Convert DER to PEM format
function ASN1.der_to_pem(der, label)
    label = label or "PUBLIC KEY"
    local base64 = base64_encode(der)

    -- Break into 64-character lines
    local lines = {}
    for i = 1, #base64, 64 do
        table.insert(lines, base64:sub(i, i + 63))
    end

    return "-----BEGIN " .. label .. "-----\n" ..
           table.concat(lines, "\n") .. "\n" ..
           "-----END " .. label .. "-----\n"
end

-- Helper function to decode base64url
function base64url_decode(str)
    -- Convert base64url to base64
    str = str:gsub('-', '+'):gsub('_', '/')
    -- Add padding if needed
    local padding = #str % 4
    if padding > 0 then
        str = str .. string.rep('=', 4 - padding)
    end
    return basexx.from_base64(str)
end

-- Helper function to convert JWK to PEM format
function M.jwk_to_pem(jwk)
    -- Decode the modulus (n) and exponent (e) from base64url
    local n_bytes = base64url_decode(jwk.n)
    local e_bytes = base64url_decode(jwk.e)

    -- Build RSA public key structure
    -- RSAPublicKey ::= SEQUENCE {
    --     modulus           INTEGER,  -- n
    --     publicExponent    INTEGER   -- e
    -- }
    local modulus_asn1 = ASN1.encode_integer(n_bytes)
    local exponent_asn1 = ASN1.encode_integer(e_bytes)
    local rsa_pubkey = ASN1.encode_sequence(modulus_asn1 .. exponent_asn1)

    -- Build SubjectPublicKeyInfo structure
    -- SubjectPublicKeyInfo ::= SEQUENCE {
    --     algorithm         AlgorithmIdentifier,
    --     subjectPublicKey  BIT STRING
    -- }

    -- RSA OID: 1.2.840.113549.1.1.1 (rsaEncryption)
    -- Encoded as: 06 09 2A 86 48 86 F7 0D 01 01 01
    local rsa_oid = string.char(0x2A, 0x86, 0x48, 0x86, 0xF7, 0x0D, 0x01, 0x01, 0x01)
    local rsa_oid_encoded = ASN1.encode_oid(rsa_oid)

    -- AlgorithmIdentifier ::= SEQUENCE {
    --     algorithm   OBJECT IDENTIFIER,
    --     parameters  NULL
    -- }
    local algorithm_id = ASN1.encode_sequence(rsa_oid_encoded .. ASN1.encode_null())

    -- Wrap the RSA public key in a BIT STRING
    local subject_public_key = ASN1.encode_bit_string(rsa_pubkey)

    -- Final SubjectPublicKeyInfo
    local spki = ASN1.encode_sequence(algorithm_id .. subject_public_key)

    -- Convert to PEM format
    return ASN1.der_to_pem(spki, "PUBLIC KEY")
end

return M
