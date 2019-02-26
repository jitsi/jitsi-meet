/**
 * Type of the action used to end a poll. This expresses that user wants to end
 * the current poll.
 *
 * {
 *     type: END_POLL
 * }
 */
export const END_POLL = Symbol('END_POLL');

/**
 * Type of the action which signals that the current poll has ended.
 *
 * {
 *     type: POLL_ENDED
 * }
 */
export const POLL_ENDED = Symbol('POLL_ENDED');

/**
 * Type of the action which signals to start voting on a poll.
 *
 * {
 *     type: POLL_STARTED,
 *     poll: Object,
 *     question: Object,
 *     choices: Object
 * }
 */
export const POLL_STARTED = Symbol('POLL_STARTED');

/**
 * Type of the action which signals that a user has casted his vote.
 *
 * {
 *     type: POLL_VOTED,
 *     choice: Object
 * }
 */
export const POLL_VOTED = Symbol('POLL_VOTED');

/**
 * Type of the action used to start a poll. This expresses that the user
 * wants to start voting on a poll.
 *
 * {
 *     type: POLL_STARTED,
 *     poll: Object,
 *     question: Object,
 *     choices: Object
 * }
 */
export const START_POLL = Symbol('START_POLL');

/**
 * Type of the action used to vote in a poll. This expresses that the user
 * wants vote for a specific choice.
 *
 * {
 *     type: VOTE_POLL,
 *     choiceID: string
 * }
 */
export const VOTE_POLL = Symbol('VOTE_POLL');
