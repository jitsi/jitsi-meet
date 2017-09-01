import type { Dispatch } from 'redux';

import JitsiMeetJS from './_';
import {
    LIB_DID_DISPOSE,
    LIB_DID_INIT,
    LIB_INIT_ERROR,
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
    return (dispatch: Dispatch<*>, getState: Function) => {
        const config = getState()['features/base/config'];

        if (!config) {
            throw new Error('Cannot init lib-jitsi-meet without config');
        }

        // FIXME Until the logic of conference.js is rewritten into the React
        // app we, JitsiMeetJS.init is to not be used for the React app.
        if (typeof APP !== 'undefined') {
            return Promise.resolve();
        }

        dispatch({ type: LIB_WILL_INIT });

        return (
            JitsiMeetJS.init(
                    Object.assign({
                        enableAnalyticsLogging: isAnalyticsEnabled({ getState })
                    },
                    config))
                .then(() => dispatch({ type: LIB_DID_INIT }))
                .catch(error => {
                    dispatch(libInitError(error));

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
 * Sets the indicator which determines whether WebRTC is ready. In execution
 * environments in which WebRTC is supported via a known plugin such
 * as Temasys WebRTC may start not ready and then become ready. Of course, there
 * are execution enviroments such as old Mozilla Firefox versions or
 * certains Microsoft Edge versions in which WebRTC is not supported at all.
 *
 * @param {boolean|Promise} webRTCReady - The indicator which determines
 * whether WebRTC is ready. If a Promise is specified, its resolution will be
 * awaited.
 * @returns {Function}
 */
export function setWebRTCReady(webRTCReady: boolean | Promise<*>) {
    return (dispatch: Dispatch<*>, getState: Function) => {
        if (getState()['features/base/lib-jitsi-meet'].webRTCReady
                !== webRTCReady) {
            dispatch({
                type: SET_WEBRTC_READY,
                webRTCReady
            });

            // If the specified webRTCReady is a thenable (i.e. a Promise), then
            // await its resolution.
            switch (typeof webRTCReady) {
            case 'function':
            case 'object': {
                const { then } = webRTCReady;

                if (typeof then === 'function') {
                    const onFulfilled = value => {
                        // Is the app still interested in the specified
                        // webRTCReady?
                        if (getState()['features/base/lib-jitsi-meet']
                                    .webRTCReady
                                === webRTCReady) {
                            dispatch(setWebRTCReady(value));
                        }
                    };

                    then.call(
                             webRTCReady,
                             /* onFulfilled */ () => onFulfilled(true),
                             /* onRejected*/ () => onFulfilled(false));
                }
                break;
            }
            }
        }
    };
}
