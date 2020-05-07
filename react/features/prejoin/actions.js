// @flow

import {
    ADD_PREJOIN_AUDIO_TRACK,
    ADD_PREJOIN_CONTENT_SHARING_TRACK,
    ADD_PREJOIN_VIDEO_TRACK,
    PREJOIN_START_CONFERENCE,
    SET_DEVICE_STATUS,
    SET_JOIN_BY_PHONE_DIALOG_VISIBLITY,
    SET_PREJOIN_AUDIO_DISABLED,
    SET_PREJOIN_AUDIO_MUTED,
    SET_PREJOIN_DEVICE_ERRORS,
    SET_PREJOIN_NAME,
    SET_PREJOIN_PAGE_VISIBILITY,
    SET_PREJOIN_VIDEO_DISABLED,
    SET_PREJOIN_VIDEO_MUTED
} from './actionTypes';
import { createLocalTrack } from '../base/lib-jitsi-meet';
import { getAudioTrack, getVideoTrack } from './functions';
import logger from './logger';

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
 * Action used to set the name of the guest user.
 *
 * @param {string} value - The name.
 * @returns {Object}
 */
export function setPrejoinName(value: string) {
    return {
        type: SET_PREJOIN_NAME,
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
