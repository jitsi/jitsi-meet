/**
 * The type of the action which signals that we need to remove poll from the history(local storage).
 *
 * {
 *     type: REMOVE_POLL_FROM_HISTORY,
 *     meetingId: string,
 *     pollId: string,
 *     poll: IPoll
 * }
 */
export const REMOVE_POLL_FROM_HISTORY = 'REMOVE_POLL_FROM_HISTORY';

/**
 * The type of the action triggered when the poll is saved in history(local storage).
 *
 * {
 *     type: SAVE_POLL_IN_HISTORY,
 *     poll: Poll,
 *     pollId: string,
 *     saved: boolean
 * }
 */
export const SAVE_POLL_IN_HISTORY = 'SAVE_POLL_IN_HISTORY';
