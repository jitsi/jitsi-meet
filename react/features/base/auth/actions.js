import axios from 'axios';

import { SET_CURRENT_USER } from './actionTypes';
import logger from './logger';

/**
 * Load current logged in user.
 *
 * @returns {Function}
 */
export function loadCurrentUser() {
    return async dispatch => {
        try {
            const resp = await axios.get('/auth/api/current-user', { withCredentials: true });

            dispatch(setCurrentUser(resp.data));
        } catch (err) {
            logger.warn('Failed to load current user.', err);
            dispatch(setCurrentUser());
        }
    };
}

/**
 * Set user information.
 *
 * @param {Object} user - The user's information.
 * @returns {{
 *     type: SET_CURRENT_USER,
 * }}
 */
export function setCurrentUser(user) {
    return {
        type: SET_CURRENT_USER,
        user
    };
}
