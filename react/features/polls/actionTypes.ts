/**
 * The type of the action which signals that a Poll will be changed
 *
 * {
 *     type: CHANGE_VOTE,
 * }
 *
 */
export const CHANGE_VOTE = 'CHANGE_VOTE';

/**
 * The type of the action which signals that we need to clear all polls from the state.
 * For example, we are moving to another conference.
 *
 * {
 *     type: CLEAR_POLLS
 * }
 */
export const CLEAR_POLLS = 'CLEAR_POLLS';

/**
 * The type of the action triggered when the poll is editing.
 *
 * {
 *     type: EDIT_POLL,
 *     pollId: string,
 *     editing: boolean
 * }
 */
export const EDIT_POLL = 'EDIT_POLL';

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
 * The type of the action which registers a vote.
 *
 * {
 *     type: REGISTER_VOTE,
 *     answers: Array<boolean> | null,
 *     pollId: string
 * }
 */
export const REGISTER_VOTE = 'REGISTER_VOTE';

/**
 * The type of the action which signals that we need to remove poll.
 *
 * {
 *     type: REMOVE_POLL,
 *     pollId: string,
 *     poll: IPoll
 * }
 */
export const REMOVE_POLL = 'REMOVE_POLL';

/**
 * The type of the action triggered when the poll tab in chat pane is closed
 *
 * {
 *     type: RESET_NB_UNREAD_POLLS,
 * }
 */
export const RESET_NB_UNREAD_POLLS = 'RESET_NB_UNREAD_POLLS';

/**
 * The type of the action triggered when the poll is saved.
 *
 * {
 *     type: SAVE_POLL,
 *     poll: Poll,
 *     pollId: string,
 *     saved: boolean
 * }
 */
export const SAVE_POLL = 'SAVE_POLL';
