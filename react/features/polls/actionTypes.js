/**
 * Action for initiating a poll from a participant.
 */
export const POLL_SESSION_INITIATED = Symbol('POLL_SESSION_INITIATED');

/**
 * Indicates the start of a poll session for all participants.
 */
export const POLL_SESSION_STARTED = Symbol('POLL_SESSION_STARTED');

/**
 * Indicates current participant voted for an item.
 */
export const POLL_SESSION_VOTE = Symbol('POLL_SESSION_VOTE');

/**
 * Indicates a user voted for an item.
 */
export const POLL_SESSION_VOTE_RECIEVED = Symbol('POLL_SESSION_VOTE_RECIEVED');

/**
 * Indicates the end of a poll session.
 */
export const POLL_SESSION_END = Symbol('POLL_SESSION_ENDED');

/**
 * Indicates the end of a poll session for all participants.
 */
export const POLL_SESSION_FINISHED = Symbol('POLL_SESSION_FINISHED');
