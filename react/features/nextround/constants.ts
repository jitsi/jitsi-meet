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
 * Base URL of the NextRound API. The welcome page calls it cross-origin with a
 * Clerk Bearer token to create/join meeting rooms.
 */
export const NEXTROUND_API_BASE = 'http://localhost:4000';

/**
 * The font stack Google Meet uses. Shared by every NextRound surface so the
 * sign-in, org picker, guest and welcome screens all match.
 *
 * Google Sans is proprietary and isn't served here, so this resolves to Roboto
 * in practice (Jitsi already loads it) — the same fallback Meet gets off-domain.
 */
export const FONT_STACK = '"Google Sans", Roboto, Arial, sans-serif';
