// @flow

import {
    SET_FOLLOW_ME_MODERATOR,
    SET_FOLLOW_ME_STATE
} from './actionTypes';

/**
 * Sets the current moderator id or clears it.
 *
 * @param {?string} id - The Follow Me moderator participant id.
 * @returns {{
 *     type: SET_FOLLOW_ME_MODERATOR,
 *     id, string
 * }}
 */
export function setFollowMeModerator(id: ?string) {
    return {
        type: SET_FOLLOW_ME_MODERATOR,
        id
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
export function setFollowMeState(state: ?Object) {
    return {
        type: SET_FOLLOW_ME_STATE,
        state
    };
}
