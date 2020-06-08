/* global config */

import axios from 'axios';

import {
    SET_CURRENT_USER
} from './actionTypes';
import logger from './logger';
import { updateSettings } from '../settings';
import jitsiLocalStorage from '../../../../modules/util/JitsiLocalStorage';
import { toJid } from '../connection';

/**
 * Load current logged in user.
 *
 * @returns {Function}
 */
export function loadCurrentUser() {
    return async dispatch => {
        try {
            const resp = await axios.get('/auth/api/current-user', { withCredentials: true });
            const { data: user } = resp;

            dispatch(updateSettings({ displayName: user.name }));
            dispatch(updateSettings({ email: user.email }));
            dispatch(setCurrentUser(user));
            jitsiLocalStorage.setItem('xmpp_username_override', toJid(user.username, config.hosts));
            jitsiLocalStorage.setItem('xmpp_password_override', user.id);
        } catch (err) {
            logger.warn('Failed to load current user.', err);
            jitsiLocalStorage.removeItem('xmpp_username_override');
            jitsiLocalStorage.removeItem('xmpp_password_override');
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
    if (!user) {
        jitsiLocalStorage.removeItem('xmpp_username_override');
        jitsiLocalStorage.removeItem('xmpp_password_override');
    }

    return {
        type: SET_CURRENT_USER,
        user
    };
}
