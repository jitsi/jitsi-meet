/* @flow */

import type { Dispatch } from 'redux';

import JitsiMeetJS from './_';
import {
    LIB_DID_DISPOSE,
    LIB_DID_INIT,
    LIB_INIT_ERROR,
    LIB_INIT_PROMISE_CREATED,
    LIB_WILL_DISPOSE,
    LIB_WILL_INIT,
    SET_WEBRTC_READY
} from './actionTypes';
import { isAnalyticsEnabled } from './functions';

declare var APP: Object;

/**
 * Disposes (of) lib-jitsi-meet.
 *
 * @returns {Function}
 */
export function disposeLib() {
    return (dispatch: Dispatch<*>) => {
        dispatch({ type: LIB_WILL_DISPOSE });

        // TODO Currently, lib-jitsi-meet doesn't have the functionality to
        // dispose itself.
        dispatch({ type: LIB_DID_DISPOSE });
    };
}

/**
 * Initializes lib-jitsi-meet (i.e. {@link invokes JitsiMeetJS.init()}) with the
 * current config(uration).
 *
 * @returns {Function}
 */
export function initLib() {
    return (dispatch: Dispatch<*>, getState: Function): Promise<void> => {
        const config = getState()['features/base/config'];

        if (!config) {
            throw new Error('Cannot init lib-jitsi-meet without config');
        }

        dispatch({ type: LIB_WILL_INIT });

        const initPromise = JitsiMeetJS.init({
            enableAnalyticsLogging: isAnalyticsEnabled(getState),
            ...config
        });

        dispatch({
            type: LIB_INIT_PROMISE_CREATED,
            initPromise
        });

        return (
            initPromise
                .then(() => dispatch({ type: LIB_DID_INIT }))
                .catch(error => {
                    // TODO: See the comment in the connect action in
                    // base/connection/actions.web.js.
                    if (typeof APP === 'undefined') {
                        dispatch(libInitError(error));
                    }

                    // TODO Handle LIB_INIT_ERROR error somewhere instead.
                    console.error('lib-jitsi-meet failed to init:', error);
                    throw error;
                }));
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
 * Sets the indicator which determines whether WebRTC is ready.
 *
 * @param {boolean} webRTCReady - The indicator which determines
 * whether WebRTC is ready.
 * @returns {Function}
 */
export function setWebRTCReady(webRTCReady: boolean) {
    return (dispatch: Function, getState: Function) => {
        if (getState()['features/base/lib-jitsi-meet'].webRTCReady
                !== webRTCReady) {
            dispatch({
                type: SET_WEBRTC_READY,
                webRTCReady
            });
        }
    };
}
