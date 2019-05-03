import JitsiMeetJS from '../lib-jitsi-meet';
import {
    getUserSelectedOutputDeviceId,
    updateSettings
} from '../settings';

import {
    ADD_PENDING_DEVICE_REQUEST,
    CHECK_AND_NOTIFY_FOR_NEW_DEVICE,
    REMOVE_PENDING_DEVICE_REQUESTS,
    SET_AUDIO_INPUT_DEVICE,
    SET_VIDEO_INPUT_DEVICE,
    UPDATE_DEVICE_LIST
} from './actionTypes';
import {
    areDeviceLabelsInitialized,
    getDeviceIdByLabel,
    getDevicesFromURL,
    setAudioOutputDeviceId
} from './functions';

const logger = require('jitsi-meet-logger').getLogger(__filename);

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
                const devicesKeysToSettingsKeys = {
                    audioInput: 'micDeviceId',
                    audioOutput: 'audioOutputDeviceId',
                    videoInput: 'cameraDeviceId'
                };

                Object.keys(deviceLabels).forEach(key => {
                    const label = deviceLabels[key];
                    const deviceId = getDeviceIdByLabel(state, label, key);

                    if (deviceId) {
                        newSettings[devicesKeysToSettingsKeys[key]] = deviceId;
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
