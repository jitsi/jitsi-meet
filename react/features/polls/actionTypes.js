/**
 * End the voting in current poll.
 */
export const END_POLL = Symbol('END_POLL');

/**
 * Start voting in a poll.
 */
export const START_POLL = Symbol('START_POLL');

/**
 * Vote for a poll.
 */
export const VOTE_POLL = Symbol('VOTE_POLL');

/**
 * Indicates the end of a poll session for all participants.
 */
export const POLL_SESSION_FINISHED = Symbol('POLL_SESSION_FINISHED');

/**
 * Indicates the start of a poll session for all participants.
 */
export const POLL_SESSION_STARTED = Symbol('POLL_SESSION_STARTED');

/**
 * Indicates a user voted for all participants.
 */
export const POLL_SESSION_VOTE = Symbol('POLL_SESSION_VOTE');
