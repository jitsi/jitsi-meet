import { createPreCallTestEvent } from '../../analytics/AnalyticsEvents';
import { sendAnalytics } from '../../analytics/functions';
import { IStore } from '../../app/types';
import JitsiMeetJS from '../lib-jitsi-meet';

import { SET_PRECALL_TEST_RESULTS, SET_UNSAFE_ROOM_CONSENT } from './actionTypes';
import { getPreCallICEUrl } from './functions';
import logger from './logger';
import { IPreCallResult, IPreCallTestState, PreCallTestStatus } from './types';

/**
 * Sets the consent of the user for joining the unsafe room.
 *
 * @param {boolean} consent - The user's consent.
 * @returns {{
 *      type: SET_UNSAFE_ROOM_CONSENT,
*       consent: boolean
* }}
 */
export function setUnsafeRoomConsent(consent: boolean) {
    return {
        type: SET_UNSAFE_ROOM_CONSENT,
        consent
    };
}

/**
 * Checks whether the browser can connect through the TURN servers from the config, and over which transport, and
 * stores the result. The last result stays in place while checking again.
 *
 * @returns {Function}
 */
export function runPreCallTest() {
    return async function(dispatch: Function, getState: IStore['getState']) {
        const { result: lastResult } = getState()['features/base/premeeting'].preCallTestState;

        dispatch(setPreCallTestResults({
            result: lastResult,
            status: PreCallTestStatus.RUNNING
        }));

        try {
            const turnCredentialsUrl = getPreCallICEUrl(getState());

            if (!turnCredentialsUrl) {
                throw new Error('No TURN credentials URL provided in config');
            }

            if (typeof JitsiMeetJS.runIceConnectivityCheck !== 'function') {
                throw new Error('lib-jitsi-meet has no ICE connectivity check');
            }

            const turnCredentials = await fetch(turnCredentialsUrl);
            const { iceServers } = await turnCredentials.json();
            const result: IPreCallResult = await JitsiMeetJS.runIceConnectivityCheck(iceServers);

            logger.info('Pre-call connectivity check', result);
            sendAnalytics(createPreCallTestEvent(result));
            dispatch(setPreCallTestResults({
                result,
                status: PreCallTestStatus.FINISHED
            }));
        } catch (error) {
            // Says nothing about the user's network, e.g. the credentials URL is down, so nothing is shown.
            logger.warn('Failed to run the pre-call connectivity check', error);

            dispatch(setPreCallTestResults({ status: PreCallTestStatus.FAILED }));
        }
    };
}

/**
 * Action used to set data from precall test.
 *
 * @param {IPreCallTestState} value - The precall test results.
 * @returns {Object}
 */
export function setPreCallTestResults(value: IPreCallTestState) {
    return {
        type: SET_PRECALL_TEST_RESULTS,
        value
    };
}
