/* @flow */

import type { Dispatch } from 'redux';

import {
    JitsiConferenceEvents,
    libInitError,
    WEBRTC_NOT_READY,
    WEBRTC_NOT_SUPPORTED
} from '../lib-jitsi-meet';
import UIEvents from '../../../../service/UI/UIEvents';

declare var APP: Object;
declare var config: Object;

const logger = require('jitsi-meet-logger').getLogger(__filename);

export {
    connectionEstablished,
    connectionFailed,
    setLocationURL
} from './actions.native.js';

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

        // XXX For web based version we use conference initialization logic
        // from the old app (at the moment of writing).
        return APP.conference.init({ roomName: room }).then(() => {
            if (APP.logCollector) {
                // Start the LogCollector's periodic "store logs" task
                APP.logCollector.start();
                APP.logCollectorStarted = true;

                // Make an attempt to flush in case a lot of logs have been
                // cached, before the collector was started.
                APP.logCollector.flush();

                // This event listener will flush the logs, before
                // the statistics module (CallStats) is stopped.
                //
                // NOTE The LogCollector is not stopped, because this event can
                // be triggered multiple times during single conference
                // (whenever statistics module is stopped). That includes
                // the case when Jicofo terminates the single person left in the
                // room. It will then restart the media session when someone
                // eventually join the room which will start the stats again.
                APP.conference.addConferenceListener(
                    JitsiConferenceEvents.BEFORE_STATISTICS_DISPOSED,
                    () => {
                        if (APP.logCollector) {
                            APP.logCollector.flush();
                        }
                    }
                );
            }

            APP.UI.initConference();

            APP.UI.addListener(
                    UIEvents.LANG_CHANGED,
                    language => APP.translation.setLanguage(language));

            APP.keyboardshortcut.init();

            if (config.requireDisplayName && !APP.settings.getDisplayName()) {
                APP.UI.promptDisplayName();
            }
        })
            .catch(error => {
                APP.UI.hideRingOverLay();
                APP.API.notifyConferenceLeft(APP.conference.roomName);
                logger.error(error);

                // TODO The following are in fact Errors raised by
                // JitsiMeetJS.init() which should be taken care of in
                // features/base/lib-jitsi-meet but we are not there yet on the
                // Web at the time of this writing.
                switch (error.name) {
                case WEBRTC_NOT_READY:
                case WEBRTC_NOT_SUPPORTED:
                    dispatch(libInitError(error));
                }
            });
    };
}

/**
 * Closes connection.
 *
 * @returns {Function}
 */
export function disconnect() {
    // XXX For web based version we use conference hanging up logic from the old
    // app.
    return () => APP.conference.hangup();
}
