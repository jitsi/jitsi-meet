/**
 * NextRound-specific constants.
 *
 * The Clerk *publishable* key is public by design (it ships in the client
 * bundle), so embedding it here is safe. The matching secret key lives only in
 * the NextRound API backend, never in this frontend.
 */
export const CLERK_PUBLISHABLE_KEY
    = 'pk_test_bWFueS1vYXJmaXNoLTg2LmNsZXJrLmFjY291bnRzLmRldiQ';

/**
 * Base URL of the NextRound API.
 *
 * In dev the frontend is served from :8080 and the API from :4000, so it calls
 * cross-origin at localhost:4000. In production the API lives behind the same
 * origin as the meeting frontend (nginx proxies /api, /join, /health,
 * /webhooks), so an empty base makes `fetch('/api/...')` resolve same-origin —
 * a candidate's browser must never be pointed at its own localhost.
 */
export const NEXTROUND_API_BASE
    = (/^(localhost|127\.0\.0\.1)$/).test(window.location.hostname)
        ? 'http://localhost:4000'
        : '';

/**
 * The font stack Google Meet uses. Shared by every NextRound surface so the
 * sign-in, org picker, guest and welcome screens all match.
 *
 * Google Sans is proprietary and isn't served here, so this resolves to Roboto
 * in practice (Jitsi already loads it) — the same fallback Meet gets off-domain.
 */
export const FONT_STACK = '"Google Sans", Roboto, Arial, sans-serif';
