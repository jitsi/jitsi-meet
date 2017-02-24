/* @flow */

import type { Dispatch } from 'redux';

import JitsiMeetJS from './';
import {
    LIB_DISPOSED,
    LIB_INIT_ERROR,
    LIB_INITIALIZED,
    SET_CONFIG
} from './actionTypes';

declare var APP: Object;

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
    return (dispatch: Dispatch<*>) => {
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
    return (dispatch: Dispatch<*>, getState: Function) => {
        const { config } = getState()['features/base/lib-jitsi-meet'];

        if (!config) {
            throw new Error('Cannot init lib-jitsi-meet without config');
        }

        // XXX Temporarily until conference.js is moved to the React app we
        // shouldn't use JitsiMeetJS from the React app.
        if (typeof APP !== 'undefined') {
            return Promise.resolve();
        }

        return JitsiMeetJS.init(config)
            .then(() => dispatch({ type: LIB_INITIALIZED }))
            .catch(error => {
                dispatch(libInitError(error));

                // TODO Handle LIB_INIT_ERROR error somewhere instead.
                console.error('lib-jitsi-meet failed to init:', error);
                throw error;
            });
    };
}

/**
 * Notifies about a specific error raised by {@link JitsiMeetJS.init()}.
 *
 * @param {Error} error - The Error raised by JitsiMeetJS.init().
 * @returns {{
 *     type: LIB_INIT_ERROR,
 *     error: Error
 * }}
 */
export function libInitError(error: Error) {
    return {
        type: LIB_INIT_ERROR,
        error
    };
}

/**
 * Sets config.
 *
 * @param {Object} config - The config(uration) object in the format accepted by
 * the JitsiMeetJS.init() method.
 * @returns {{
 *     type: SET_CONFIG,
 *     config: Object
 * }}
 */
export function setConfig(config: Object) {
    return {
        type: SET_CONFIG,
        config
    };
}
