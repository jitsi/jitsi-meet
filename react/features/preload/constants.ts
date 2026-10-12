/**
 * Milliseconds after which a config.js or branding request started by the preload script is
 * abandoned. The app waits on these requests instead of making its own, so they must not be able to
 * hang forever; once one is abandoned the app requests the resource itself. Generous enough not to
 * cut off a slow but working backend, short enough that a stalled connection is retried while the
 * user is still waiting.
 */
export const PRELOAD_FETCH_TIMEOUT = 10000;
