// @flow

declare var JitsiMeetJS: Object;

import uuid from 'uuid';

import { getDialOutStatusUrl, getDialOutUrl } from '../base/config/functions';
import { createLocalTrack } from '../base/lib-jitsi-meet';
import { isVideoMutedByUser } from '../base/media';
import {
    getLocalAudioTrack,
    getLocalVideoTrack,
    trackAdded,
    replaceLocalTrack
} from '../base/tracks';
import { createLocalTracksF } from '../base/tracks/functions';
import { openURLInBrowser } from '../base/util';
import { executeDialOutRequest, executeDialOutStatusRequest, getDialInfoPageURL } from '../invite/functions';
import { showErrorNotification } from '../notifications';

import {
    PREJOIN_INITIALIZED,
    PREJOIN_START_CONFERENCE,
    SET_DEVICE_STATUS,
    SET_DIALOUT_COUNTRY,
    SET_DIALOUT_NUMBER,
    SET_DIALOUT_STATUS,
    SET_PREJOIN_DISPLAY_NAME_REQUIRED,
    SET_SKIP_PREJOIN,
    SET_SKIP_PREJOIN_RELOAD,
    SET_JOIN_BY_PHONE_DIALOG_VISIBLITY,
    SET_PRECALL_TEST_RESULTS,
    SET_PREJOIN_DEVICE_ERRORS,
    SET_PREJOIN_PAGE_VISIBILITY
} from './actionTypes';
import {
    getFullDialOutNumber,
    getDialOutConferenceUrl,
    getDialOutCountry,
    isJoinByPhoneDialogVisible
} from './functions';
import logger from './logger';

const dialOutStatusToKeyMap = {
    INITIATED: 'presenceStatus.calling',
    RINGING: 'presenceStatus.ringing'
};

const DIAL_OUT_STATUS = {
    INITIATED: 'INITIATED',
    RINGING: 'RINGING',
    CONNECTED: 'CONNECTED',
    DISCONNECTED: 'DISCONNECTED',
    FAILED: 'FAILED'
};

/**
 * The time interval used between requests while polling for dial out status.
 */
const STATUS_REQ_FREQUENCY = 2000;

/**
 * The maximum number of retries while polling for dial out status.
 */
const STATUS_REQ_CAP = 45;

/**
 * Polls for status change after dial out.
 * Changes dialog message based on response, closes the dialog if there is an error,
 * joins the meeting when CONNECTED.
 *
 * @param {string} reqId - The request id used to correlate the dial out request with this one.
 * @param {Function} onSuccess - Success handler.
 * @param {Function} onFail - Fail handler.
 * @param {number} count - The number of retried calls. When it hits STATUS_REQ_CAP it should no longer make requests.
 * @returns {Function}
 */
function pollForStatus(
        reqId: string,
        onSuccess: Function,
        onFail: Function,
        count = 0) {
    return async function(dispatch: Function, getState: Function) {
        const state = getState();

        try {
            if (!isJoinByPhoneDialogVisible(state)) {
                return;
            }

            const res = await executeDialOutStatusRequest(getDialOutStatusUrl(state), reqId);

            switch (res) {
            case DIAL_OUT_STATUS.INITIATED:
            case DIAL_OUT_STATUS.RINGING: {
                dispatch(setDialOutStatus(dialOutStatusToKeyMap[res]));

                if (count < STATUS_REQ_CAP) {
                    return setTimeout(() => {
                        dispatch(pollForStatus(reqId, onSuccess, onFail, count + 1));
                    }, STATUS_REQ_FREQUENCY);
                }

                return onFail();
            }

            case DIAL_OUT_STATUS.CONNECTED: {
                return onSuccess();
            }

            case DIAL_OUT_STATUS.DISCONNECTED: {
                dispatch(showErrorNotification({
                    titleKey: 'prejoin.errorDialOutDisconnected'
                }));

                return onFail();
            }

            case DIAL_OUT_STATUS.FAILED: {
                dispatch(showErrorNotification({
                    titleKey: 'prejoin.errorDialOutFailed'
                }));

                return onFail();
            }
            }
        } catch (err) {
            dispatch(showErrorNotification({
                titleKey: 'prejoin.errorDialOutStatus'
            }));
            logger.error('Error getting dial out status', err);
            onFail();
        }
    };
}


/**
 * Action used for joining the meeting with phone audio.
 * A dial out connection is tried and a polling mechanism is used for getting the status.
 * If the connection succeeds the `onSuccess` callback is executed.
 * If the phone connection fails or the number is invalid the `onFail` callback is executed.
 *
 * @param {Function} onSuccess - Success handler.
 * @param {Function} onFail - Fail handler.
 * @returns {Function}
 */
export function dialOut(onSuccess: Function, onFail: Function) {
    return async function(dispatch: Function, getState: Function) {
        const state = getState();
        const reqId = uuid.v4();
        const url = getDialOutUrl(state);
        const conferenceUrl = getDialOutConferenceUrl(state);
        const phoneNumber = getFullDialOutNumber(state);
        const countryCode = getDialOutCountry(state).code.toUpperCase();

        const body = {
            conferenceUrl,
            countryCode,
            name: phoneNumber,
            phoneNumber
        };

        try {
            await executeDialOutRequest(url, body, reqId);

            dispatch(pollForStatus(reqId, onSuccess, onFail));
        } catch (err) {
            const notification = {
                titleKey: 'prejoin.errorDialOut',
                titleArguments: undefined
            };

            if (err.status) {
                if (err.messageKey === 'validation.failed') {
                    notification.titleKey = 'prejoin.errorValidation';
                } else {
                    notification.titleKey = 'prejoin.errorStatusCode';
                    notification.titleArguments = { status: err.status };
                }
            }

            dispatch(showErrorNotification(notification));
            logger.error('Error dialing out', err);
            onFail();
        }
    };
}

/**
 * Adds all the newly created tracks to store on init.
 *
 * @param {Object[]} tracks - The newly created tracks.
 * @param {Object} errors - The errors from creating the tracks.
 *
 * @returns {Function}
 */
export function initPrejoin(tracks: Object[], errors: Object) {
    return async function(dispatch: Function) {
        dispatch(setPrejoinDeviceErrors(errors));
        dispatch(prejoinInitialized());

        tracks.forEach(track => dispatch(trackAdded(track)));
    };
}

/**
 * Action used to start the conference.
 *
 * @param {Object} options - The config options that override the default ones (if any).
 * @returns {Function}
 */
export function joinConference(options?: Object) {
    return {
        type: PREJOIN_START_CONFERENCE,
        options
    };
}

/**
 * Joins the conference without audio.
 *
 * @returns {Function}
 */
export function joinConferenceWithoutAudio() {
    return async function(dispatch: Function, getState: Function) {
        const tracks = getState()['features/base/tracks'];
        const audioTrack = getLocalAudioTrack(tracks)?.jitsiTrack;

        if (audioTrack) {
            await dispatch(replaceLocalTrack(audioTrack, null));
        }

        dispatch(joinConference({
            startSilent: true
        }));
    };
}

/**
 * Initializes the 'precallTest' and executes one test, storing the results.
 *
 * @param {Object} conferenceOptions - The conference options.
 * @returns {Function}
 */
export function makePrecallTest(conferenceOptions: Object) {
    return async function(dispatch: Function) {
        try {
            await JitsiMeetJS.precallTest.init(conferenceOptions);
            const results = await JitsiMeetJS.precallTest.execute();

            dispatch(setPrecallTestResults(results));
        } catch (error) {
            logger.debug('Failed to execute pre call test - ', error);
        }
    };
}

/**
 * Opens an external page with all the dial in numbers.
 *
 * @returns {Function}
 */
export function openDialInPage() {
    return function(dispatch: Function, getState: Function) {
        const dialInPage = getDialInfoPageURL(getState());

        openURLInBrowser(dialInPage, true);
    };
}

/**
 * Action used to signal that the prejoin page has been initialized.
 *
 * @returns {Object}
 */
function prejoinInitialized() {
    return {
        type: PREJOIN_INITIALIZED
    };
}

/**
 * Creates a new audio track based on a device id and replaces the current one.
 *
 * @param {string} deviceId - The deviceId of the microphone.
 * @returns {Function}
 */
export function replaceAudioTrackById(deviceId: string) {
    return async (dispatch: Function, getState: Function) => {
        try {
            const tracks = getState()['features/base/tracks'];
            const newTrack = await createLocalTrack('audio', deviceId);
            const oldTrack = getLocalAudioTrack(tracks)?.jitsiTrack;

            dispatch(replaceLocalTrack(oldTrack, newTrack));
        } catch (err) {
            dispatch(setDeviceStatusWarning('prejoin.audioTrackError'));
            logger.log('Error replacing audio track', err);
        }
    };
}

/**
 * Creates a new video track based on a device id and replaces the current one.
 *
 * @param {string} deviceId - The deviceId of the camera.
 * @returns {Function}
 */
export function replaceVideoTrackById(deviceId: Object) {
    return async (dispatch: Function, getState: Function) => {
        try {
            const tracks = getState()['features/base/tracks'];
            const wasVideoMuted = isVideoMutedByUser(getState());
            const [ newTrack ] = await createLocalTracksF(
                { cameraDeviceId: deviceId,
                    devices: [ 'video' ] },
                { dispatch,
                    getState }
            );
            const oldTrack = getLocalVideoTrack(tracks)?.jitsiTrack;

            dispatch(replaceLocalTrack(oldTrack, newTrack));
            wasVideoMuted && newTrack.mute();
        } catch (err) {
            dispatch(setDeviceStatusWarning('prejoin.videoTrackError'));
            logger.log('Error replacing video track', err);
        }
    };
}

/**
 * Sets the device status as OK with the corresponding text.
 *
 * @param {string} deviceStatusText - The text to be set.
 * @returns {Object}
 */
export function setDeviceStatusOk(deviceStatusText: string) {
    return {
        type: SET_DEVICE_STATUS,
        value: {
            deviceStatusText,
            deviceStatusType: 'ok'
        }
    };
}

/**
 * Sets the device status as 'warning' with the corresponding text.
 *
 * @param {string} deviceStatusText - The text to be set.
 * @returns {Object}
 */
export function setDeviceStatusWarning(deviceStatusText: string) {
    return {
        type: SET_DEVICE_STATUS,
        value: {
            deviceStatusText,
            deviceStatusType: 'warning'
        }
    };
}

/**
 * Action used to set the dial out status.
 *
 * @param {string} value - The status.
 * @returns {Object}
 */
function setDialOutStatus(value: string) {
    return {
        type: SET_DIALOUT_STATUS,
        value
    };
}

/**
 * Action used to set the dial out country.
 *
 * @param {{ name: string, dialCode: string, code: string }} value - The country.
 * @returns {Object}
 */
export function setDialOutCountry(value: Object) {
    return {
        type: SET_DIALOUT_COUNTRY,
        value
    };
}

/**
 * Action used to set the stance of the display name.
 *
 * @returns {Object}
 */
export function setPrejoinDisplayNameRequired() {
    return {
        type: SET_PREJOIN_DISPLAY_NAME_REQUIRED
    };
}

/**
 * Action used to set the dial out number.
 *
 * @param {string} value - The dial out number.
 * @returns {Object}
 */
export function setDialOutNumber(value: string) {
    return {
        type: SET_DIALOUT_NUMBER,
        value
    };
}

/**
 * Sets the visibility of the prejoin page for future uses.
 *
 * @param {boolean} value - The visibility value.
 * @returns {Object}
 */
export function setSkipPrejoin(value: boolean) {
    return {
        type: SET_SKIP_PREJOIN,
        value
    };
}

/**
 * Sets the visibility of the prejoin page when a client reload
 * is triggered as a result of call migration initiated by Jicofo.
 *
 * @param {boolean} value - The visibility value.
 * @returns {Object}
 */
export function setSkipPrejoinOnReload(value: boolean) {
    return {
        type: SET_SKIP_PREJOIN_RELOAD,
        value
    };
}

/**
 * Action used to set the visiblitiy of the 'JoinByPhoneDialog'.
 *
 * @param {boolean} value - The value.
 * @returns {Object}
 */
export function setJoinByPhoneDialogVisiblity(value: boolean) {
    return {
        type: SET_JOIN_BY_PHONE_DIALOG_VISIBLITY,
        value
    };
}

/**
 * Action used to set data from precall test.
 *
 * @param {Object} value - The precall test results.
 * @returns {Object}
 */
export function setPrecallTestResults(value: Object) {
    return {
        type: SET_PRECALL_TEST_RESULTS,
        value
    };
}

/**
 * Action used to set the initial errors after creating the tracks.
 *
 * @param {Object} value - The track errors.
 * @returns {Object}
 */
export function setPrejoinDeviceErrors(value: Object) {
    return {
        type: SET_PREJOIN_DEVICE_ERRORS,
        value
    };
}

/**
 * Action used to set the visibility of the prejoin page.
 *
 * @param {boolean} value - The value.
 * @returns {Object}
 */
export function setPrejoinPageVisibility(value: boolean) {
    return {
        type: SET_PREJOIN_PAGE_VISIBILITY,
        value
    };
}
