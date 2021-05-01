// @flow

/**
 * The type of the action which signals that a new Poll was received.
 *
 * {
 *     type: RECEIVE_POLL,
 *     poll: Poll
 *     pollId: string,
 * }
 *
 */
export const RECEIVE_POLL = 'RECEIVE_POLL';

/**
 * The type of the action which signals that a new Answer was received.
 *
 * {
 *     type: RECEIVE_ANSWER,
 *     answer: Answer
 *     pollId: string,
 * }
 */
export const RECEIVE_ANSWER = 'RECEIVE_ANSWER';
