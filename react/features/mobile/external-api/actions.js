import { SET_API_SESSION } from './actionTypes';

/**
 * FIXME.
 *
 * @param {string} url - FIXME.
 * @param {string} state - FIXME.
 * @public
 * @returns {{
 *     type: SET_API_SESSION,
 *     url: {string},
 *     state: {string}
 * }}
 */
export function setAPISession(url, state, data) {
    return {
        type: SET_API_SESSION,
        url,
        state,
        data
    };
}
