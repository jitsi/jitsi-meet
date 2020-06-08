// @flow

import axios from 'axios';
import type { Dispatch } from 'redux';

import {
    SET_CURRENT_USER
} from './actionTypes';
import logger from './logger';
import { updateSettings } from '../settings';

/**
 * Load current logged in user.
 *
 * @returns {Function}
 */
export function loadCurrentUser() {
    return async (dispatch: Dispatch<any>) => {
        try {
            const resp = await axios.get('/auth/api/current-user', { withCredentials: true });
            const { data: user } = resp;

            dispatch(updateSettings({ displayName: user.name }));
            dispatch(updateSettings({ email: user.email }));
            dispatch(setCurrentUser(user));
        } catch (err) {
            logger.warn('Failed to load current user.', err);
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
export function setCurrentUser(user: Object = null) {
    return {
        type: SET_CURRENT_USER,
        user
    };
}
