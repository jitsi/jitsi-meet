import fs from 'fs';
import jwt from 'jsonwebtoken';
import path from 'path';
import { fileURLToPath } from 'url';


const DEFAULT_SECRET = 'testsecret';
const DEFAULT_APP_ID = 'jitsi';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Fixed RSA key pair for login ASAP (RS256) tokens.
// The public key is copied into the Prosody Docker image and served via
// mod_test_observer_http at /test-observer/asap-keys/ so that mod_auth_token
// can fetch it when verifying RS256 login tokens.
// The kid must be "test-asap-key"; mod_auth_token derives the fetch URL as:
//   <asap_key_server>/<sha256hex(kid)>.pem
// which equals /test-observer/asap-keys/dc6983da...dfc.pem.
export const ASAP_KID = 'test-asap-key';
export const ASAP_PRIVATE_KEY = fs.readFileSync(
    path.join(__dirname, '../fixtures/test-asap-private.pem'), 'utf8');

// Separate RSA key pair for system ASAP tokens used by HTTP API modules such as
// mod_muc_end_meeting.  The public key is served at /test-observer/system-asap-keys/
// (prosody_password_public_key_repo_url) so that system modules can verify tokens
// signed with this key.  Login tokens (signed with ASAP_PRIVATE_KEY) are rejected
// by the system key server, and system tokens are rejected by the login key server.
export const SYSTEM_ASAP_KID = 'test-system-asap-key';
export const SYSTEM_ASAP_PRIVATE_KEY = fs.readFileSync(
    path.join(__dirname, '../fixtures/test-system-asap-private.pem'), 'utf8');

/**
 * Builds a standard JWT payload with sane defaults.
 *
 * @param {object} [overrides]  Fields to merge / override.
 * @param {object} [opts]
 * @param {boolean} [opts.expired]    If true, set exp to one hour in the past.
 * @param {boolean} [opts.notYetValid] If true, set nbf to one hour in the future.
 */
function buildPayload(overrides = {}, { expired = false, notYetValid = false } = {}) {
    const now = Math.floor(Date.now() / 1000);

    return {
        iss: DEFAULT_APP_ID,
        aud: DEFAULT_APP_ID,
        sub: '*',
        iat: now,
        exp: expired ? now - 3600 : now + 3600,
        ...notYetValid ? { nbf: now + 3600 } : {},
        ...overrides
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
export function mintToken(overrides = {}, { secret = DEFAULT_SECRET, expired = false, notYetValid = false } = {}) {
    return jwt.sign(buildPayload(overrides, { expired,
        notYetValid }), secret, { algorithm: 'HS256' });
}

/**
 * Mints an RS256 login JWT for ASAP tests.
 *
 * The token is signed with the test login RSA private key. Prosody fetches the
 * matching public key from mod_test_observer_http's /asap-keys/ route
 * (configured via asap_key_server on VirtualHost "localhost").
 *
 * These tokens are REJECTED by mod_muc_end_meeting and other system HTTP API
 * modules, which use a separate key server (prosody_password_public_key_repo_url).
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
    notYetValid = false
} = {}) {
    // sub: '*' satisfies the mandatory sub claim check in process_and_verify_token
    // and the domain verification in verify_room (wildcard allows any MUC domain).
    return jwt.sign(
        buildPayload({ sub: '*',
            ...overrides }, { expired,
            notYetValid }),
        privateKey,
        { algorithm: 'RS256',
            keyid: kid }
    );
}

/**
 * Mints an RS256 system JWT for HTTP API modules such as mod_muc_end_meeting.
 *
 * The token is signed with the test system RSA private key. Prosody fetches
 * the matching public key from mod_test_observer_http's /system-asap-keys/ route
 * (configured via prosody_password_public_key_repo_url).
 *
 * These tokens are REJECTED by mod_auth_token (login), which uses a different
 * key server (asap_key_server).
 *
 * @param {object} [overrides]  Fields to merge / override in the payload.
 * @param {object} [opts]
 * @param {string} [opts.privateKey]  PEM private key (default: test-system-asap-private.pem).
 * @param {string} [opts.kid]         Key ID (default: SYSTEM_ASAP_KID).
 * @param {boolean} [opts.expired]    If true, set exp to one hour in the past.
 * @returns {string} Signed JWT string.
 */
export function mintSystemToken(overrides = {}, {
    privateKey = SYSTEM_ASAP_PRIVATE_KEY,
    kid = SYSTEM_ASAP_KID,
    expired = false,
    notYetValid = false
} = {}) {
    return jwt.sign(
        buildPayload({ sub: 'system.localhost',
            ...overrides }, { expired,
            notYetValid }),
        privateKey,
        { algorithm: 'RS256',
            keyid: kid }
    );
}
