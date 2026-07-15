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
