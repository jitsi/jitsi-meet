import { SET_SESSION } from './actionTypes';

/**
 * FIXME.
 *
 * @param {string} session - FIXME.
 * @returns {{
 *     type: SET_SESSION
 * }}
 */
export function setSession(session) {
    return {
        type: SET_SESSION,
        session
    };
}
