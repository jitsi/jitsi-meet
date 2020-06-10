// @flow

import type { Dispatch } from 'redux';

declare var APP: Object;
declare var config: Object;

import { configureInitialDevices } from '../devices';
import { getBackendSafeRoomName } from '../util';

export {
    connectionDisconnected,
    connectionEstablished,
    connectionFailed,
    setLocationURL
} from './actions.native';
import logger from './logger';

/**
 * Opens new connection.
 *
 * @returns {Promise<JitsiConnection>}
 */
export function connect() {
    return (dispatch: Dispatch<any>, getState: Function) => {
        const room = getBackendSafeRoomName(getState()['features/base/conference'].room);

        // XXX For web based version we use conference initialization logic
        // from the old app (at the moment of writing).
        return dispatch(configureInitialDevices()).then(
            () => APP.conference.init({
                roomName: room
            }).catch(error => {
                APP.API.notifyConferenceLeft(APP.conference.roomName);
                logger.error(error);
            }));
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
