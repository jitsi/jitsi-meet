import {
    SET_FOLLOW_ME_MODERATOR,
    SET_FOLLOW_ME_STATE
} from './actionTypes';

/**
 * Sets the current moderator id or clears it.
 *
 * @param {?string} id - The Follow Me moderator participant id.
 * @param {?boolean} forRecorder - Whether this is command only for recorder.
 * @returns {{
 *     type: SET_FOLLOW_ME_MODERATOR,
 *     id: string,
 *     forRecorder: boolean
 * }}
 */
export function setFollowMeModerator(id?: string, forRecorder?: boolean) {
    return {
        type: SET_FOLLOW_ME_MODERATOR,
        id,
        forRecorder
    };
}

/**
 * Sets the Follow Me feature state.
 *
 * @param {?Object} state - The current state.
 * @returns {{
 *     type: SET_FOLLOW_ME_STATE,
 *     state: Object
 * }}
 */
export function setFollowMeState(state?: Object) {
    return {
        type: SET_FOLLOW_ME_STATE,
        state
    };
}
