local cjson_safe  = require 'cjson.safe'
local basexx = require 'basexx'
local digest = require 'openssl.digest'
local hmac   = require 'openssl.hmac'
local pkey   = require 'openssl.pkey'

-- Generates an RSA signature of the data.
-- @param data The data to be signed.
-- @param key The private signing key in PEM format.
-- @param algo The digest algorithm to user when generating the signature: sha256, sha384, or sha512.
-- @return The signature or nil and an error message.
local function signRS (data, key, algo)
	local privkey = pkey.new(key)
	if privkey == nil then
		return nil, 'Not a private PEM key'
	else
		local datadigest = digest.new(algo):update(data)
		return privkey:sign(datadigest)
	end
end

-- Verifies an RSA signature on the data.
-- @param data The signed data.
-- @param signature The signature to be verified.
-- @param key The public key of the signer.
-- @param algo The digest algorithm to user when generating the signature: sha256, sha384, or sha512.
-- @return True if the signature is valid, false otherwise. Also returns false if the key is invalid.
local function verifyRS (data, signature, key, algo)
	local pubkey = pkey.new(key)
	if pubkey == nil then
		return false
	end

	local datadigest = digest.new(algo):update(data)
	return pubkey:verify(signature, datadigest)
end

local alg_sign = {
	['HS256'] = function(data, key) return hmac.new(key, 'sha256'):final(data) end,
	['HS384'] = function(data, key) return hmac.new(key, 'sha384'):final(data) end,
	['HS512'] = function(data, key) return hmac.new(key, 'sha512'):final(data) end,
	['RS256'] = function(data, key) return signRS(data, key, 'sha256') end,
	['RS384'] = function(data, key) return signRS(data, key, 'sha384') end,
	['RS512'] = function(data, key) return signRS(data, key, 'sha512') end
}

local alg_verify = {
	['HS256'] = function(data, signature, key) return signature == alg_sign['HS256'](data, key) end,
	['HS384'] = function(data, signature, key) return signature == alg_sign['HS384'](data, key) end,
	['HS512'] = function(data, signature, key) return signature == alg_sign['HS512'](data, key) end,
	['RS256'] = function(data, signature, key) return verifyRS(data, signature, key, 'sha256') end,
	['RS384'] = function(data, signature, key) return verifyRS(data, signature, key, 'sha384') end,
	['RS512'] = function(data, signature, key) return verifyRS(data, signature, key, 'sha512') end
}

-- Splits a token into segments, separated by '.'.
-- @param token The full token to be split.
-- @return A table of segments.
local function split_token(token)
	local segments={}
  for str in string.gmatch(token, "([^\\.]+)") do
    table.insert(segments, str)
  end
  return segments
end

-- Parses a JWT token into it's header, body, and signature.
-- @param token The JWT token to be parsed.
-- @return A JSON header and body represented as a table, and a signature.
local function parse_token(token)
	local segments=split_token(token)
  if #segments ~= 3 then
		return nil, nil, nil, "Invalid token"
	end

	local header, err = cjson_safe.decode(basexx.from_url64(segments[1]))
	if err then
		return nil, nil, nil, "Invalid header"
	end

	local body, err = cjson_safe.decode(basexx.from_url64(segments[2]))
	if err then
		return nil, nil, nil, "Invalid body"
	end

	local sig, err = basexx.from_url64(segments[3])
	if err then
		return nil, nil, nil, "Invalid signature"
	end

	return header, body, sig
end

-- Removes the signature from a JWT token.
-- @param token A JWT token.
-- @return The token without its signature.
local function strip_signature(token)
	local segments=split_token(token)
  if #segments ~= 3 then
		return nil, nil, nil, "Invalid token"
	end

	table.remove(segments)
	return table.concat(segments, ".")
end

-- Verifies that a claim is in a list of allowed claims. Allowed claims can be exact values, or the
-- catch all wildcard '*'.
-- @param claim The claim to be verified.
-- @param acceptedClaims A table of accepted claims.
-- @return True if the claim was allowed, false otherwise.
local function verify_claim(claim, acceptedClaims)
  for i, accepted in ipairs(acceptedClaims) do
    if accepted == '*' then
      return true;
    end
    if claim == accepted then
      return true;
    end
  end

  return false;
end

local M = {}

-- Encodes the data into a signed JWT token.
-- @param data The data the put in the body of the JWT token.
-- @param key The key to use for signing the JWT token.
-- @param alg The signature algorithm to use: HS256, HS384, HS512, RS256, RS384, or RS512.
-- @param header Additional values to put in the JWT header.
-- @param The resulting JWT token, or nil and an error message.
function M.encode(data, key, alg, header)
	if type(data) ~= 'table' then return nil, "Argument #1 must be table" end
	if type(key) ~= 'string' then return nil, "Argument #2 must be string" end

	alg = alg or "HS256"

	if not alg_sign[alg] then
		return nil, "Algorithm not supported"
	end

	header = header or {}

	header['typ'] = 'JWT'
	header['alg'] = alg

	local headerEncoded, err = cjson_safe.encode(header)
	if headerEncoded == nil then
		return nil, err
	end

	local dataEncoded, err = cjson_safe.encode(data)
	if dataEncoded == nil then
		return nil, err
	end

	local segments = {
		basexx.to_url64(headerEncoded),
		basexx.to_url64(dataEncoded)
	}

	local signing_input = table.concat(segments, ".")
	local signature, error = alg_sign[alg](signing_input, key)
	if signature == nil then
		return nil, error
	end

	segments[#segments+1] = basexx.to_url64(signature)

	return table.concat(segments, ".")
end

-- Verify that the token is valid, and if it is return the decoded JSON payload data.
-- @param token The token to verify.
-- @param expectedAlgo The signature algorithm the caller expects the token to be signed with:
--     HS256, HS384, HS512, RS256, RS384, or RS512.
-- @param key The verification key used for the signature.
-- @param acceptedIssuers Optional table of accepted issuers. If not nil, the 'iss' claim will be
--     checked against this list.
-- @param acceptedAudiences Optional table of accepted audiences. If not nil, the 'aud' claim will
--     be checked against this list.
-- @return A table representing the JSON body of the token, or nil and an error message.
function M.verify(token, expectedAlgo, key, acceptedIssuers, acceptedAudiences)
	if type(token) ~= 'string' then return nil, "token argument must be string" end
	if type(expectedAlgo) ~= 'string' then return nil, "algorithm argument must be string" end
	if type(key) ~= 'string' then return nil, "key argument must be string" end
	if acceptedIssuers ~= nil and type(acceptedIssuers) ~= 'table' then
		return nil, "acceptedIssuers argument must be table"
	end
	if acceptedAudiences ~= nil and type(acceptedAudiences) ~= 'table' then
		return nil, "acceptedAudiences argument must be table"
	end

	if not alg_verify[expectedAlgo] then
		return nil, "Algorithm not supported"
	end

	local header, body, sig, err = parse_token(token)
	if err ~= nil then
		return nil, err
	end

	-- Validate header
	if not header.typ or header.typ ~= "JWT" then
		return nil, "Invalid typ"
	end

	if not header.alg or header.alg ~= expectedAlgo then
		return nil, "Invalid or incorrect alg"
	end

	-- Validate signature
	if not alg_verify[expectedAlgo](strip_signature(token), sig, key) then
		return nil, 'Invalid signature'
	end

	-- Validate body
	if body.exp and type(body.exp) ~= "number" then
		return nil, "exp must be number"
	end

	if body.nbf and type(body.nbf) ~= "number" then
		return nil, "nbf must be number"
	end


	if body.exp and os.time() >= body.exp then
		return nil, "Not acceptable by exp"
	end

	if body.nbf and os.time() < body.nbf then
		return nil, "Not acceptable by nbf"
	end

	if acceptedIssuers ~= nil then
		local issClaim = body.iss;
		if issClaim == nil then
        return nil, "'iss' claim is missing";
    end
    if not verify_claim(issClaim, acceptedIssuers) then
        return nil, "invalid 'iss' claim";
    end
	end

	if acceptedAudiences ~= nil then
		local audClaim = body.aud;
		if audClaim == nil then
        return nil, "'aud' claim is missing";
    end
    if not verify_claim(audClaim, acceptedAudiences) then
        return nil, "invalid 'aud' claim";
    end
	end

	return body
end

return M
