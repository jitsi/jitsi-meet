import {
    CURRENT_USER_UPDATED
} from './actionTypes';

/**
 * Update user information.
 *
 * @param {Object} user - The user's information.
 * @returns {{
 *     type: CURRENT_USER_UPDATED,
 * }}
 */
export function updateCurrentUser(user) {
    return {
        type: CURRENT_USER_UPDATED,
        user
    };
}
