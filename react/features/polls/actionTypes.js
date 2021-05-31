// @flow

/**
 * The type of the action which signals that a new Poll was received.
 *
 * {
 *     type: RECEIVE_POLL,
 *     poll: Poll,
 *     pollId: string,
 *     notify: boolean
 * }
 *
 */
export const RECEIVE_POLL = 'RECEIVE_POLL';

/**
 * The type of the action which signals that a new Answer was received.
 *
 * {
 *     type: RECEIVE_ANSWER,
 *     answer: Answer,
 *     pollId: string,
 * }
 */
export const RECEIVE_ANSWER = 'RECEIVE_ANSWER';

/**
 * The type of the action which set the answered field of a poll.
 *
 * {
 *     type: SET_ANSWERED_STATUS,
 *     answered: boolean
 *     pollId: string,
 * }
 */
export const SET_ANSWERED_STATUS = 'SET_ANSWERED_STATUS';


/**
 * The type of the action triggered when the poll tab in chat pane is closed
 *
 * {
 *     type: CLOSE_POLL_TAB,
 * }
 */
export const CLOSE_POLL_TAB = 'CLOSE_POLL_TAB';
