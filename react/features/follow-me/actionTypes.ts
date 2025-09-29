/**
 * The id of the Follow Me moderator.
 *
 * {
 *     type: SET_FOLLOW_ME_MODERATOR,
 *     id: boolean
 * }
 */
export const SET_FOLLOW_ME_MODERATOR = 'SET_FOLLOW_ME_MODERATOR';

/**
 * The type of (redux) action which updates the current known state of the
 * Follow Me feature.
 *
 *
 * {
 *     type: SET_FOLLOW_ME_STATE,
 *     state: boolean
 * }
 */
export const SET_FOLLOW_ME_STATE = 'SET_FOLLOW_ME_STATE';

/**
 * The type of (redux) action which updates the current known status of the
 * Follow Me feature.
 *
 * {
 *     type: SET_FOLLOW_ME,
 *     enabled: boolean
 * }
 */
export const SET_FOLLOW_ME = 'SET_FOLLOW_ME';

/**
 * The type of (redux) action which updates the current known status of the
 * Follow Me feature that is used only by the recorder.
 *
 * {
 *     type: SET_FOLLOW_ME_RECORDER,
 *     enabled: boolean
 * }
 */
export const SET_FOLLOW_ME_RECORDER = 'SET_FOLLOW_ME_RECORDER';
