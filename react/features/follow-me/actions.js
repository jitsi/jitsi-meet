// @flow

import {
    SET_FOLLOW_ME_ACTIVE
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
