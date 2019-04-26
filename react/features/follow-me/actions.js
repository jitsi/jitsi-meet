// @flow

import {
    SET_FOLLOW_ME_ACTIVE,
    SET_FOLLOW_ME_STATE
} from './actionTypes';

/**
 * Sets active or inactive for the Follow Me feature.
 *
 * @param {boolean} enabled - Whether or not Follow Me should be active.
 * @param {?string} id - The Follow Me moderator participant id.
 * @returns {{
 *     type: SET_FOLLOW_ME_ACTIVE,
 *     enabled: boolean,
 *     id, string
 * }}
 */
export function setFollowMeActive(enabled: boolean, id: ?string) {
    return {
        type: SET_FOLLOW_ME_ACTIVE,
        enabled,
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
