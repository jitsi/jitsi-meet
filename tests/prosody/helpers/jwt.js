import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import jwt from 'jsonwebtoken';

const DEFAULT_SECRET = 'testsecret';
const DEFAULT_APP_ID = 'jitsi';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Fixed RSA key pair for ASAP (RS256) tests.
// The public key is also copied into the Prosody Docker image and served via
// mod_test_observer_http so that mod_auth_token can fetch it when verifying tokens.
// The kid must be "test-asap-key"; mod_auth_token derives the fetch URL as:
//   <asap_key_server>/<sha256hex(kid)>.pem
// which equals /test-observer/asap-keys/dc6983da...dfc.pem.
export const ASAP_KID = 'test-asap-key';
export const ASAP_PRIVATE_KEY = fs.readFileSync(
    path.join(__dirname, '../fixtures/test-asap-private.pem'), 'utf8');

/**
 * Builds a standard JWT payload with sane defaults.
 *
 * @param {object} [overrides]  Fields to merge / override.
 * @param {boolean} [expired]   If true, set exp to one hour in the past.
 */
function buildPayload(overrides = {}, expired = false) {
    const now = Math.floor(Date.now() / 1000);

    return {
        iss: DEFAULT_APP_ID,
        aud: DEFAULT_APP_ID,
        iat: now,
        exp: expired ? now - 3600 : now + 3600,
        ...overrides,
    };
}

/**
 * Mints an HS256 JWT compatible with mod_auth_token / luajwtjitsi.
 *
 * luajwtjitsi.verify() checks:
 *   - header.typ === "JWT"
 *   - header.alg === signatureAlgorithm (HS256 in test config for "localhost")
 *   - HMAC-SHA256 signature with appSecret
 *   - exp, iss, aud claims
 *
 * util.lib.lua additionally checks:
 *   - requireRoomClaim (false in test config)
 *   - sets session.jitsi_meet_context_features from claims.context.features
 *
 * @param {object} [overrides]  Fields to merge / override in the payload.
 * @param {object} [opts]
 * @param {string} [opts.secret]   Signing secret (default: testsecret).
 * @param {boolean} [opts.expired] If true, set exp to one hour in the past.
 * @returns {string} Signed JWT string.
 */
export function mintToken(overrides = {}, { secret = DEFAULT_SECRET, expired = false } = {}) {
    return jwt.sign(buildPayload(overrides, expired), secret, { algorithm: 'HS256' });
}

/**
 * Mints an RS256 JWT for ASAP tests (VirtualHost "asap.localhost").
 *
 * The token is signed with the test RSA private key. Prosody fetches the
 * matching public key from mod_test_observer_http's /asap-keys/ route.
 *
 * @param {object} [overrides]  Fields to merge / override in the payload.
 * @param {object} [opts]
 * @param {string} [opts.privateKey]  PEM private key (default: test-asap-private.pem).
 * @param {string} [opts.kid]         Key ID (default: ASAP_KID).
 * @param {boolean} [opts.expired]    If true, set exp to one hour in the past.
 * @returns {string} Signed JWT string.
 */
export function mintAsapToken(overrides = {}, {
    privateKey = ASAP_PRIVATE_KEY,
    kid = ASAP_KID,
    expired = false,
} = {}) {
    return jwt.sign(
        buildPayload(overrides, expired),
        privateKey,
        { algorithm: 'RS256', keyid: kid }
    );
}
