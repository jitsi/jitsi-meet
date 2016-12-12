import {
    LIB_DISPOSED,
    SET_CONFIG
} from './actionTypes';
import './middleware';
import './reducer';

/**
 * Disposes lib-jitsi-meet.
 *
 * @returns {Function}
 */
export function disposeLib() {
    // XXX We're wrapping it with Promise, because:
    // a) to be better aligned with initLib() method, which is async.
    // b) as currently there is no implementation for it in lib-jitsi-meet, and
    // there is a big chance it will be async.
    // TODO Currently, lib-jitsi-meet doesn't have any functionality to
    // dispose itself.
    return dispatch => {
        dispatch({ type: LIB_DISPOSED });

        return Promise.resolve();
    };
}

/**
 * Initializes lib-jitsi-meet with passed configuration.
 *
 * @returns {Function}
 */
export function initLib() {
    return (dispatch, getState) => {
        const config = getState()['features/base/lib-jitsi-meet'].config;

        if (!config) {
            throw new Error('Cannot initialize lib-jitsi-meet without config');
        }

        // XXX Temporary solution. Until conference.js hasn't been moved
        // to the react app we shouldn't use JitsiMeetJS from react app.
        return Promise.resolve();
    };
}

/**
 * Sets config.
 *
 * @param {Object} config - Config object accepted by JitsiMeetJS#init()
 * method.
 * @returns {{
 *      type: SET_CONFIG,
 *      config: Object
 *  }}
 */
export function setConfig(config) {
    return {
        type: SET_CONFIG,
        config
    };
}
