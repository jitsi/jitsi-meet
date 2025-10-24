import {
    SET_FOLLOW_ME,
    SET_FOLLOW_ME_MODERATOR,
    SET_FOLLOW_ME_RECORDER,
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

/**
 * Enables or disables the Follow Me feature.
 *
 * @param {boolean} enabled - Whether or not Follow Me should be enabled.
 * @returns {{
 *     type: SET_FOLLOW_ME,
 *     enabled: boolean
 * }}
 */
export function setFollowMe(enabled: boolean) {
    return {
        type: SET_FOLLOW_ME,
        enabled
    };
}

/**
 * Enables or disables the Follow Me feature used only for the recorder.
 *
 * @param {boolean} enabled - Whether Follow Me should be enabled and used only by the recorder.
 * @returns {{
 *     type: SET_FOLLOW_ME_RECORDER,
 *     enabled: boolean
 * }}
 */
export function setFollowMeRecorder(enabled: boolean) {
    return {
        type: SET_FOLLOW_ME_RECORDER,
        enabled
    };
}
