import { v4 as uuidv4 } from 'uuid';

import { IStore } from '../app/types';
import { updateConfig } from '../base/config/actions';
import { getDialOutStatusUrl, getDialOutUrl } from '../base/config/functions';
import { connect } from '../base/connection/actions';
import { createLocalTrack } from '../base/lib-jitsi-meet/functions';
import { isVideoMutedByUser } from '../base/media/functions';
import { updateSettings } from '../base/settings/actions';
import { replaceLocalTrack } from '../base/tracks/actions';
import {
    createLocalTracksF,
    getLocalAudioTrack,
    getLocalVideoTrack
} from '../base/tracks/functions';
import { openURLInBrowser } from '../base/util/openURLInBrowser';
import { executeDialOutRequest, executeDialOutStatusRequest, getDialInfoPageURL } from '../invite/functions';
import { showErrorNotification } from '../notifications/actions';
import { INotificationProps } from '../notifications/types';

import {
    PREJOIN_JOINING_IN_PROGRESS,
    SET_DEVICE_STATUS,
    SET_DIALOUT_COUNTRY,
    SET_DIALOUT_NUMBER,
    SET_DIALOUT_STATUS,
    SET_JOIN_BY_PHONE_DIALOG_VISIBLITY,
    SET_PREJOIN_DEVICE_ERRORS,
    SET_PREJOIN_PAGE_VISIBILITY,
    SET_SKIP_PREJOIN_RELOAD
} from './actionTypes';
import {
    getDialOutConferenceUrl,
    getDialOutCountry,
    getFullDialOutNumber,
    isJoinByPhoneDialogVisible
} from './functions.any';
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
    return async function(dispatch: IStore['dispatch'], getState: IStore['getState']) {
        const state = getState();

        try {
            if (!isJoinByPhoneDialogVisible(state)) {
                return;
            }

            const res = await executeDialOutStatusRequest(getDialOutStatusUrl(state) ?? '', reqId);

            switch (res) {
            case DIAL_OUT_STATUS.INITIATED:
            case DIAL_OUT_STATUS.RINGING: {
                dispatch(setDialOutStatus(dialOutStatusToKeyMap[res as keyof typeof dialOutStatusToKeyMap]));

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
    return async function(dispatch: IStore['dispatch'], getState: IStore['getState']) {
        const state = getState();
        const reqId = uuidv4();
        const url = getDialOutUrl(state) ?? '';
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
        } catch (err: any) {
            const notification: INotificationProps = {
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
 * Action used to start the conference.
 *
 * @param {Object} options - The config options that override the default ones (if any).
 * @param {boolean} ignoreJoiningInProgress - If true we won't check the joiningInProgress flag.
 * @param {string?} jid - The XMPP user's ID (e.g. {@code user@server.com}).
 * @param {string?} password - The XMPP user's password.
 * @returns {Function}
 */
export function joinConference(options?: Object, ignoreJoiningInProgress = false,
        jid?: string, password?: string) {
    return function(dispatch: IStore['dispatch'], getState: IStore['getState']) {
        if (!ignoreJoiningInProgress) {
            const state = getState();
            const { joiningInProgress } = state['features/prejoin'];

            if (joiningInProgress) {
                return;
            }

            dispatch(setJoiningInProgress(true));
        }

        options && dispatch(updateConfig(options));

        logger.info('Dispatching connect from joinConference.');
        dispatch(connect(jid, password))
        .catch(() => {
            // There is nothing to do here. This is handled and dispatched in base/connection/actions.
        });
    };
}


/**
 * Action used to set the flag for joining operation in progress.
 *
 * @param {boolean} value - The config options that override the default ones (if any).
 * @returns {Function}
 */
export function setJoiningInProgress(value: boolean) {
    return {
        type: PREJOIN_JOINING_IN_PROGRESS,
        value
    };
}


/**
 * Joins the conference without audio.
 *
 * @returns {Function}
 */
export function joinConferenceWithoutAudio() {
    return async function(dispatch: IStore['dispatch'], getState: IStore['getState']) {
        const state = getState();
        const { joiningInProgress } = state['features/prejoin'];

        if (joiningInProgress) {
            return;
        }

        dispatch(setJoiningInProgress(true));
        const tracks = state['features/base/tracks'];
        const audioTrack = getLocalAudioTrack(tracks)?.jitsiTrack;

        if (audioTrack) {
            try {
                await dispatch(replaceLocalTrack(audioTrack, null));
            } catch (error) {
                logger.error(`Failed to replace local audio with null: ${error}`);
            }
        }

        logger.info('Dispatching joinConference action with startSilent=true from joinConferenceWithoutAudio.');

        dispatch(joinConference({
            startSilent: true
        }, true));
    };
}

/**
 * Opens an external page with all the dial in numbers.
 *
 * @returns {Function}
 */
export function openDialInPage() {
    return function(dispatch: IStore['dispatch'], getState: IStore['getState']) {
        const dialInPage = getDialInfoPageURL(getState());

        openURLInBrowser(dialInPage, true);
    };
}

/**
 * Creates a new audio track based on a device id and replaces the current one.
 *
 * @param {string} deviceId - The deviceId of the microphone.
 * @returns {Function}
 */
export function replaceAudioTrackById(deviceId: string) {
    return async (dispatch: IStore['dispatch'], getState: IStore['getState']) => {
        try {
            const tracks = getState()['features/base/tracks'];
            const newTrack = await createLocalTrack('audio', deviceId);
            const oldTrack = getLocalAudioTrack(tracks)?.jitsiTrack;
            const micDeviceId = newTrack.getDeviceId();

            logger.info(`Switching audio input device to ${micDeviceId}`);
            dispatch(replaceLocalTrack(oldTrack, newTrack)).then(() => {
                dispatch(updateSettings({
                    micDeviceId
                }));
            });
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
export function replaceVideoTrackById(deviceId: string) {
    return async (dispatch: IStore['dispatch'], getState: IStore['getState']) => {
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
            const cameraDeviceId = newTrack.getDeviceId();

            logger.info(`Switching camera to ${cameraDeviceId}`);
            dispatch(replaceLocalTrack(oldTrack, newTrack)).then(() => {
                dispatch(updateSettings({
                    cameraDeviceId
                }));
            });
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
