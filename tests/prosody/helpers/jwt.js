import jwt from 'jsonwebtoken';

const DEFAULT_SECRET = 'testsecret';
const DEFAULT_APP_ID = 'jitsi';

/**
 * Mints an HS256 JWT compatible with mod_auth_token / luajwtjitsi.
 *
 * luajwtjitsi.verify() checks:
 *   - header.typ === "JWT"
 *   - header.alg === signatureAlgorithm (HS256 in test config)
 *   - HMAC-SHA256 signature with appSecret
 *   - exp (if present) not in the past
 *   - iss in acceptedIssuers (defaults to [appId] = ["jitsi"])
 *   - aud in acceptedAudiences (defaults to ["*"] = any)
 *
 * util.lib.lua additionally checks:
 *   - requireRoomClaim (false in test config, so room is optional)
 *   - sets session.jitsi_meet_context_features from claims.context.features
 *
 * @param {object} [overrides]  Fields to merge / override in the payload.
 * @param {object} [opts]
 * @param {string} [opts.secret]   Signing secret (default: testsecret).
 * @param {boolean} [opts.expired] If true, set exp to one hour in the past.
 * @returns {string} Signed JWT string.
 */
export function mintToken(overrides = {}, { secret = DEFAULT_SECRET, expired = false } = {}) {
    const now = Math.floor(Date.now() / 1000);
    const payload = {
        iss: DEFAULT_APP_ID,
        aud: DEFAULT_APP_ID,
        iat: now,
        exp: expired ? now - 3600 : now + 3600,
        ...overrides,
    };

    return jwt.sign(payload, secret, { algorithm: 'HS256' });
}
