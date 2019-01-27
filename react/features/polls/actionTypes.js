/**
 * Action used by local user to end a poll.
 */
export const END_POLL = Symbol('END_POLL');

/**
 * Action used to update Redux state and end the current poll.
 */
export const POLL_SESSION_FINISHED = Symbol('POLL_SESSION_FINISHED');

/**
 * Action used to update Redux state and start a new poll.
 */
export const POLL_SESSION_STARTED = Symbol('POLL_SESSION_STARTED');

/**
 * Action used to update Redux state and toggle users' votes.
 */
export const POLL_SESSION_VOTE = Symbol('POLL_SESSION_VOTE');

/**
 * Action used by local user to start a poll.
 */
export const START_POLL = Symbol('START_POLL');

/**
 * Action used by local user to toggle their vote.
 */
export const VOTE_POLL = Symbol('VOTE_POLL');
