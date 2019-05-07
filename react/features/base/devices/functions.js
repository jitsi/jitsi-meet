// @flow

import { parseURLParams } from '../config';
import JitsiMeetJS from '../lib-jitsi-meet';
import { updateSettings } from '../settings';

declare var APP: Object;

/**
 * Detects the use case when the labels are not available if the A/V permissions
 * are not yet granted.
 *
 * @param {Object} state - The redux state.
 * @returns {boolean} - True if the labels are already initialized and false
 * otherwise.
 */
export function areDeviceLabelsInitialized(state: Object) {
    // TODO: Replace with something that doesn't use APP when the conference.js logic is reactified.
    if (APP.conference._localTracksInitialized) {
        return true;
    }

    for (const type of [ 'audioInput', 'audioOutput', 'videoInput' ]) {
        if ((state['features/base/devices'].availableDevices[type] || []).find(d => Boolean(d.label))) {
            return true;
        }
    }

    return false;
}

/**
 * Get device id of the audio output device which is currently in use.
 * Empty string stands for default device.
 *
 * @returns {string}
 */
export function getAudioOutputDeviceId() {
    return JitsiMeetJS.mediaDevices.getAudioOutputDevice();
}

/**
 * Finds a device with a label that matches the passed label and returns its id.
 *
 * @param {Object} state - The redux state.
 * @param {string} label - The label.
 * @param {string} kind - The type of the device. One of "audioInput",
 * "audioOutput", and "videoInput". Also supported is all lowercase versions
 * of the preceding types.
 * @returns {string|undefined}
 */
export function getDeviceIdByLabel(state: Object, label: string, kind: string) {
    const webrtcKindToJitsiKindTranslator = {
        audioinput: 'audioInput',
        audiooutput: 'audioOutput',
        videoinput: 'videoInput'
    };

    const kindToSearch = webrtcKindToJitsiKindTranslator[kind] || kind;

    const device
        = (state['features/base/devices'].availableDevices[kindToSearch] || [])
            .find(d => d.label === label);

    if (device) {
        return device.deviceId;
    }
}

/**
 * Finds a device with a label that matches the passed id and returns its label.
 *
 * @param {Object} state - The redux state.
 * @param {string} id - The device id.
 * @param {string} kind - The type of the device. One of "audioInput",
 * "audioOutput", and "videoInput". Also supported is all lowercase versions
 * of the preceding types.
 * @returns {string|undefined}
 */
export function getDeviceLabelById(state: Object, id: string, kind: string) {
    const webrtcKindToJitsiKindTranslator = {
        audioinput: 'audioInput',
        audiooutput: 'audioOutput',
        videoinput: 'videoInput'
    };

    const kindToSearch = webrtcKindToJitsiKindTranslator[kind] || kind;

    const device
        = (state['features/base/devices'].availableDevices[kindToSearch] || [])
        .find(d => d.deviceId === id);

    if (device) {
        return device.label;
    }
}

/**
 * Returns the devices set in the URL.
 *
 * @param {Object} state - The redux state.
 * @returns {Object|undefined}
 */
export function getDevicesFromURL(state: Object) {
    const urlParams
        = parseURLParams(state['features/base/connection'].locationURL);

    const audioOutput = urlParams['devices.audioOutput'];
    const videoInput = urlParams['devices.videoInput'];
    const audioInput = urlParams['devices.audioInput'];

    if (!audioOutput && !videoInput && !audioInput) {
        return undefined;
    }

    const devices = {};

    audioOutput && (devices.audioOutput = audioOutput);
    videoInput && (devices.videoInput = videoInput);
    audioInput && (devices.audioInput = audioInput);

    return devices;
}

/**
 * Converts an array of media devices into an object organized by device kind.
 *
 * @param {Array<MediaDeviceInfo>} devices - Available media devices.
 * @private
 * @returns {Object} An object with the media devices split by type. The keys
 * are device type and the values are arrays with devices matching the device
 * type.
 */
export function groupDevicesByKind(devices: Object[]): Object {
    return {
        audioInput: devices.filter(device => device.kind === 'audioinput'),
        audioOutput: devices.filter(device => device.kind === 'audiooutput'),
        videoInput: devices.filter(device => device.kind === 'videoinput')
    };
}

/**
 * Set device id of the audio output device which is currently in use.
 * Empty string stands for default device.
 *
 * @param {string} newId - New audio output device id.
 * @param {Function} dispatch - The Redux dispatch function.
 * @param {boolean} userSelection - Whether this is a user selection update.
 * @param {?string} newLabel - New audio output device label to store.
 * @returns {Promise}
 */
export function setAudioOutputDeviceId(
        newId: string = 'default',
        dispatch: Function,
        userSelection: boolean = false,
        newLabel: ?string): Promise<*> {
    return JitsiMeetJS.mediaDevices.setAudioOutputDevice(newId)
        .then(() => {
            const newSettings = {
                audioOutputDeviceId: newId,
                userSelectedAudioOutputDeviceId: undefined,
                userSelectedAudioOutputDeviceLabel: undefined
            };

            if (userSelection) {
                newSettings.userSelectedAudioOutputDeviceId = newId;
                newSettings.userSelectedAudioOutputDeviceLabel = newLabel;
            } else {
                // a flow workaround, I needed to add 'userSelectedAudioOutputDeviceId: undefined'
                delete newSettings.userSelectedAudioOutputDeviceId;
                delete newSettings.userSelectedAudioOutputDeviceLabel;
            }

            return dispatch(updateSettings(newSettings));
        });
}
