// @flow

import uuid from 'uuid';

import { getRoomName } from '../base/conference';
import {
    ADD_PREJOIN_AUDIO_TRACK,
    ADD_PREJOIN_CONTENT_SHARING_TRACK,
    ADD_PREJOIN_VIDEO_TRACK,
    PREJOIN_START_CONFERENCE,
    SET_DEVICE_STATUS,
    SET_DIALOUT_COUNTRY,
    SET_DIALOUT_NUMBER,
    SET_DIALOUT_STATUS,
    SET_SKIP_PREJOIN,
    SET_JOIN_BY_PHONE_DIALOG_VISIBLITY,
    SET_PREJOIN_AUDIO_DISABLED,
    SET_PREJOIN_AUDIO_MUTED,
    SET_PREJOIN_DEVICE_ERRORS,
    SET_PREJOIN_PAGE_VISIBILITY,
    SET_PREJOIN_VIDEO_DISABLED,
    SET_PREJOIN_VIDEO_MUTED
} from './actionTypes';
import { getDialOutStatusUrl, getDialOutUrl } from '../base/config/functions';
import { createLocalTrack } from '../base/lib-jitsi-meet';
import { openURLInBrowser } from '../base/util';
import { executeDialOutRequest, executeDialOutStatusRequest, getDialInfoPageURL } from '../invite/functions';
import logger from './logger';
import { showErrorNotification } from '../notifications';

import {
    getFullDialOutNumber,
    getAudioTrack,
    getDialOutConferenceUrl,
    getDialOutCountry,
    getVideoTrack,
    isJoinByPhoneDialogVisible
} from './functions';

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
 * Action used to add an audio track to the store.
 *
 * @param {Object} value - The track to be added.
 * @returns {Object}
 */
export function addPrejoinAudioTrack(value: Object) {
    return {
        type: ADD_PREJOIN_AUDIO_TRACK,
        value
    };
}

/**
 * Action used to add a video track to the store.
 *
 * @param {Object} value - The track to be added.
 * @returns {Object}
 */
export function addPrejoinVideoTrack(value: Object) {
    return {
        type: ADD_PREJOIN_VIDEO_TRACK,
        value
    };
}

/**
 * Action used to add a content sharing track to the store.
 *
 * @param {Object} value - The track to be added.
 * @returns {Object}
 */
export function addPrejoinContentSharingTrack(value: Object) {
    return {
        type: ADD_PREJOIN_CONTENT_SHARING_TRACK,
        value
    };
}

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
        const audioTrack = tracks.find(t => t.isAudioTrack());
        const videoTrack = tracks.find(t => t.isVideoTrack());

        dispatch(setPrejoinDeviceErrors(errors));

        if (audioTrack) {
            dispatch(addPrejoinAudioTrack(audioTrack));
        } else {
            dispatch(setAudioDisabled());
        }

        if (videoTrack) {
            if (videoTrack.videoType === 'desktop') {
                dispatch(addPrejoinContentSharingTrack(videoTrack));
                dispatch(setPrejoinVideoDisabled(true));
            } else {
                dispatch(addPrejoinVideoTrack(videoTrack));
            }
        } else {
            dispatch(setPrejoinVideoDisabled(true));
        }
    };
}

/**
 * Joins the conference.
 *
 * @returns {Function}
 */
export function joinConference() {
    return function(dispatch: Function) {
        dispatch(setPrejoinPageVisibility(false));
        dispatch(startConference());
    };
}

/**
 * Joins the conference without audio.
 *
 * @returns {Function}
 */
export function joinConferenceWithoutAudio() {
    return async function(dispatch: Function, getState: Function) {
        const audioTrack = getAudioTrack(getState());

        if (audioTrack) {
            await dispatch(replacePrejoinAudioTrack(null));
        }
        dispatch(setAudioDisabled());
        dispatch(joinConference());
    };
}

/**
 * Opens an external page with all the dial in numbers.
 *
 * @returns {Function}
 */
export function openDialInPage() {
    return function(dispatch: Function, getState: Function) {
        const state = getState();
        const locationURL = state['features/base/connection'].locationURL;
        const roomName = getRoomName(state);
        const dialInPage = getDialInfoPageURL(roomName, locationURL);

        openURLInBrowser(dialInPage, true);
    };
}

/**
 * Replaces the existing audio track with a new one.
 *
 * @param {Object} track - The new track.
 * @returns {Function}
 */
export function replacePrejoinAudioTrack(track: Object) {
    return async (dispatch: Function, getState: Function) => {
        const oldTrack = getAudioTrack(getState());

        oldTrack && await oldTrack.dispose();
        dispatch(addPrejoinAudioTrack(track));
    };
}

/**
 * Creates a new audio track based on a device id and replaces the current one.
 *
 * @param {string} deviceId - The deviceId of the microphone.
 * @returns {Function}
 */
export function replaceAudioTrackById(deviceId: string) {
    return async (dispatch: Function) => {
        try {
            const track = await createLocalTrack('audio', deviceId);

            dispatch(replacePrejoinAudioTrack(track));
        } catch (err) {
            dispatch(setDeviceStatusWarning('prejoin.audioTrackError'));
            logger.log('Error replacing audio track', err);
        }
    };
}

/**
 * Replaces the existing video track with a new one.
 *
 * @param {Object} track - The new track.
 * @returns {Function}
 */
export function replacePrejoinVideoTrack(track: Object) {
    return async (dispatch: Function, getState: Function) => {
        const oldTrack = getVideoTrack(getState());

        oldTrack && await oldTrack.dispose();
        dispatch(addPrejoinVideoTrack(track));
    };
}

/**
 * Creates a new video track based on a device id and replaces the current one.
 *
 * @param {string} deviceId - The deviceId of the camera.
 * @returns {Function}
 */
export function replaceVideoTrackById(deviceId: Object) {
    return async (dispatch: Function) => {
        try {
            const track = await createLocalTrack('video', deviceId);

            dispatch(replacePrejoinVideoTrack(track));
        } catch (err) {
            dispatch(setDeviceStatusWarning('prejoin.videoTrackError'));
            logger.log('Error replacing video track', err);
        }
    };
}


/**
 * Action used to mark audio muted.
 *
 * @param {boolean} value - True for muted.
 * @returns {Object}
 */
export function setPrejoinAudioMuted(value: boolean) {
    return {
        type: SET_PREJOIN_AUDIO_MUTED,
        value
    };
}

/**
 * Action used to mark video disabled.
 *
 * @param {boolean} value - True for muted.
 * @returns {Object}
 */
export function setPrejoinVideoDisabled(value: boolean) {
    return {
        type: SET_PREJOIN_VIDEO_DISABLED,
        value
    };
}


/**
 * Action used to mark video muted.
 *
 * @param {boolean} value - True for muted.
 * @returns {Object}
 */
export function setPrejoinVideoMuted(value: boolean) {
    return {
        type: SET_PREJOIN_VIDEO_MUTED,
        value
    };
}

/**
 * Action used to mark audio as disabled.
 *
 * @returns {Object}
 */
export function setAudioDisabled() {
    return {
        type: SET_PREJOIN_AUDIO_DISABLED
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
 * Action used to set the visiblity of the prejoin page.
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

/**
 * Action used to mark the start of the conference.
 *
 * @returns {Object}
 */
function startConference() {
    return {
        type: PREJOIN_START_CONFERENCE
    };
}
