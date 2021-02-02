import JitsiMeetJS from '../lib-jitsi-meet';
import {
    getUserSelectedOutputDeviceId,
    updateSettings
} from '../settings';

import {
    ADD_PENDING_DEVICE_REQUEST,
    CHECK_AND_NOTIFY_FOR_NEW_DEVICE,
    DEVICE_PERMISSIONS_CHANGED,
    NOTIFY_CAMERA_ERROR,
    NOTIFY_MIC_ERROR,
    REMOVE_PENDING_DEVICE_REQUESTS,
    SET_AUDIO_INPUT_DEVICE,
    SET_VIDEO_INPUT_DEVICE,
    UPDATE_DEVICE_LIST
} from './actionTypes';
import {
    areDeviceLabelsInitialized,
    getDeviceIdByLabel,
    getDeviceLabelById,
    getDevicesFromURL,
    setAudioOutputDeviceId
} from './functions';
import logger from './logger';

/**
 * Maps the WebRTC string for device type to the keys used to store configure,
 * within redux, which devices should be used by default.
 */
const DEVICE_TYPE_TO_SETTINGS_KEYS = {
    audioInput: {
        currentDeviceId: 'micDeviceId',
        userSelectedDeviceId: 'userSelectedMicDeviceId',
        userSelectedDeviceLabel: 'userSelectedMicDeviceLabel'
    },
    audioOutput: {
        currentDeviceId: 'audioOutputDeviceId',
        userSelectedDeviceId: 'userSelectedAudioOutputDeviceId',
        userSelectedDeviceLabel: 'userSelectedAudioOutputDeviceLabel'
    },
    videoInput: {
        currentDeviceId: 'audioOutputDeviceId',
        userSelectedDeviceId: 'userSelectedCameraDeviceId',
        userSelectedDeviceLabel: 'userSelectedCameraDeviceLabel'
    }
};

/**
 * Adds a pending device request.
 *
 * @param {Object} request - The request to be added.
 * @returns {{
 *      type: ADD_PENDING_DEVICE_REQUEST,
 *      request: Object
 * }}
 */
export function addPendingDeviceRequest(request) {
    return {
        type: ADD_PENDING_DEVICE_REQUEST,
        request
    };
}

/**
 * Configures the initial A/V devices before the conference has started.
 *
 * @returns {Function}
 */
export function configureInitialDevices() {
    return (dispatch, getState) => {
        const deviceLabels = getDevicesFromURL(getState());
        let updateSettingsPromise;

        if (deviceLabels) {
            updateSettingsPromise = dispatch(getAvailableDevices()).then(() => {
                const state = getState();

                if (!areDeviceLabelsInitialized(state)) {
                    // The labels are not available if the A/V permissions are
                    // not yet granted.

                    Object.keys(deviceLabels).forEach(key => {
                        dispatch(addPendingDeviceRequest({
                            type: 'devices',
                            name: 'setDevice',
                            device: {
                                kind: key.toLowerCase(),
                                label: deviceLabels[key]
                            },
                            // eslint-disable-next-line no-empty-function
                            responseCallback() {}
                        }));
                    });

                    return;
                }

                const newSettings = {};

                Object.keys(deviceLabels).forEach(key => {
                    const label = deviceLabels[key];
                    const deviceId = getDeviceIdByLabel(state, label, key);

                    if (deviceId) {
                        const settingsTranslationMap = DEVICE_TYPE_TO_SETTINGS_KEYS[key];

                        newSettings[settingsTranslationMap.currentDeviceId] = deviceId;
                        newSettings[settingsTranslationMap.userSelectedDeviceId] = deviceId;
                        newSettings[settingsTranslationMap.userSelectedDeviceLabel] = label;
                    }
                });

                dispatch(updateSettings(newSettings));
            });
        } else {
            updateSettingsPromise = Promise.resolve();
        }

        return updateSettingsPromise
            .then(() => {
                const userSelectedAudioOutputDeviceId = getUserSelectedOutputDeviceId(getState());

                return setAudioOutputDeviceId(userSelectedAudioOutputDeviceId, dispatch)
                    .catch(ex => logger.warn(`Failed to set audio output device.
                        Default audio output device will be used instead ${ex}`));
            });
    };
}

/**
 * Queries for connected A/V input and output devices and updates the redux
 * state of known devices.
 *
 * @returns {Function}
 */
export function getAvailableDevices() {
    return dispatch => new Promise(resolve => {
        const { mediaDevices } = JitsiMeetJS;

        if (mediaDevices.isDeviceListAvailable()
                && mediaDevices.isDeviceChangeAvailable()) {
            mediaDevices.enumerateDevices(devices => {
                dispatch(updateDeviceList(devices));

                resolve(devices);
            });
        } else {
            resolve([]);
        }
    });
}

/**
 * Signals that an error occurred while trying to obtain a track from a camera.
 *
 * @param {Object} error - The device error, as provided by lib-jitsi-meet.
 * @param {string} error.name - The constant for the type of the error.
 * @param {string} error.message - Optional additional information about the
 * error.
 * @returns {{
 *     type: NOTIFY_CAMERA_ERROR,
 *     error: Object
 * }}
 */
export function notifyCameraError(error) {
    return {
        type: NOTIFY_CAMERA_ERROR,
        error
    };
}

/**
 * Signals that an error occurred while trying to obtain a track from a mic.
 *
 * @param {Object} error - The device error, as provided by lib-jitsi-meet.
 * @param {Object} error.name - The constant for the type of the error.
 * @param {string} error.message - Optional additional information about the
 * error.
 * @returns {{
 *     type: NOTIFY_MIC_ERROR,
 *     error: Object
 * }}
 */
export function notifyMicError(error) {
    return {
        type: NOTIFY_MIC_ERROR,
        error
    };
}

/**
 * Remove all pending device requests.
 *
 * @returns {{
 *      type: REMOVE_PENDING_DEVICE_REQUESTS
 * }}
 */
export function removePendingDeviceRequests() {
    return {
        type: REMOVE_PENDING_DEVICE_REQUESTS
    };
}

/**
 * Signals to update the currently used audio input device.
 *
 * @param {string} deviceId - The id of the new audio input device.
 * @returns {{
 *      type: SET_AUDIO_INPUT_DEVICE,
 *      deviceId: string
 * }}
 */
export function setAudioInputDevice(deviceId) {
    return {
        type: SET_AUDIO_INPUT_DEVICE,
        deviceId
    };
}

/**
 * Sets the audio input device id and updates the settings
 * so they are persisted across sessions.
 *
 * @param {string} deviceId - The id of the new audio input device.
 * @returns {Function}
 */
export function setAudioInputDeviceAndUpdateSettings(deviceId) {
    return function(dispatch, getState) {
        const deviceLabel = getDeviceLabelById(getState(), deviceId, 'audioInput');

        dispatch(setAudioInputDevice(deviceId));
        dispatch(updateSettings({
            userSelectedMicDeviceId: deviceId,
            userSelectedMicDeviceLabel: deviceLabel
        }));
    };
}

/**
 * Updates the output device id.
 *
 * @param {string} deviceId - The id of the new output device.
 * @returns {Function}
 */
export function setAudioOutputDevice(deviceId) {
    return function(dispatch, getState) {
        const deviceLabel = getDeviceLabelById(getState(), deviceId, 'audioOutput');

        return setAudioOutputDeviceId(deviceId, dispatch, true, deviceLabel);
    };
}

/**
 * Signals to update the currently used video input device.
 *
 * @param {string} deviceId - The id of the new video input device.
 * @returns {{
 *      type: SET_VIDEO_INPUT_DEVICE,
 *      deviceId: string
 * }}
 */
export function setVideoInputDevice(deviceId) {
    return {
        type: SET_VIDEO_INPUT_DEVICE,
        deviceId
    };
}

/**
 * Sets the video input device id and updates the settings
 * so they are persisted across sessions.
 *
 * @param {string} deviceId - The id of the new video input device.
 * @returns {Function}
 */
export function setVideoInputDeviceAndUpdateSettings(deviceId) {
    return function(dispatch, getState) {
        const deviceLabel = getDeviceLabelById(getState(), deviceId, 'videoInput');

        dispatch(setVideoInputDevice(deviceId));
        dispatch(updateSettings({
            userSelectedCameraDeviceId: deviceId,
            userSelectedCameraDeviceLabel: deviceLabel
        }));
    };
}

/**
 * Signals to update the list of known audio and video devices.
 *
 * @param {Array<MediaDeviceInfo>} devices - All known available audio input,
 * audio output, and video input devices.
 * @returns {{
 *      type: UPDATE_DEVICE_LIST,
 *      devices: Array<MediaDeviceInfo>
 * }}
 */
export function updateDeviceList(devices) {
    return {
        type: UPDATE_DEVICE_LIST,
        devices
    };
}

/**
 * Signals to check new and old devices for newly added devices and notify.
 *
 * @param {Array<MediaDeviceInfo>} newDevices - Array of the new devices.
 * @param {Array<MediaDeviceInfo>} oldDevices - Array of the old devices.
 * @returns {{
 *      type: CHECK_AND_NOTIFY_FOR_NEW_DEVICE,
 *      newDevices: Array<MediaDeviceInfo>,
 *      oldDevices: Array<MediaDeviceInfo>
 * }}
 */
export function checkAndNotifyForNewDevice(newDevices, oldDevices) {
    return {
        type: CHECK_AND_NOTIFY_FOR_NEW_DEVICE,
        newDevices,
        oldDevices
    };
}

/**
 * Signals that the device permissions have changed.
 *
 * @param {Object} permissions - Object with the permissions.
 * @returns {{
 *      type: DEVICE_PERMISSIONS_CHANGED,
 *      permissions: Object
 * }}
 */
export function devicePermissionsChanged(permissions) {
    return {
        type: DEVICE_PERMISSIONS_CHANGED,
        permissions
    };
}
