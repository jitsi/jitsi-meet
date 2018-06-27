// @flow

import type { Dispatch } from 'redux';

import { libInitError, WEBRTC_NOT_SUPPORTED } from '../lib-jitsi-meet';

declare var APP: Object;
declare var config: Object;

const logger = require('jitsi-meet-logger').getLogger(__filename);

export {
    connectionEstablished,
    connectionFailed,
    setLocationURL
} from './actions.native';

/**
 * Opens new connection.
 *
 * @returns {Promise<JitsiConnection>}
 */
export function connect() {
    return (dispatch: Dispatch<*>, getState: Function) => {
        const state = getState();

        // XXX Lib-jitsi-meet does not accept uppercase letters.
        const room = state['features/base/conference'].room.toLowerCase();
        const { initPromise } = state['features/base/lib-jitsi-meet'];

        // XXX For web based version we use conference initialization logic
        // from the old app (at the moment of writing).
        return initPromise.then(() => APP.conference.init({
            roomName: room
        })).catch(error => {
            APP.API.notifyConferenceLeft(APP.conference.roomName);
            logger.error(error);

            // TODO The following are in fact Errors raised by
            // JitsiMeetJS.init() which should be taken care of in
            // features/base/lib-jitsi-meet but we are not there yet on the
            // Web at the time of this writing.
            switch (error.name) {
            case WEBRTC_NOT_SUPPORTED:
                dispatch(libInitError(error));
            }
        });
    };
}

/**
 * Closes connection.
 *
 * @param {boolean} [requestFeedback] - Whether or not to attempt showing a
 * request for call feedback.
 * @returns {Function}
 */
export function disconnect(requestFeedback: boolean = false) {
    // XXX For web based version we use conference hanging up logic from the old
    // app.
    return () => APP.conference.hangup(requestFeedback);
}
