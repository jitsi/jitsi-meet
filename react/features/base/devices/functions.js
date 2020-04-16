// @flow

import { parseURLParams } from '../config';
import JitsiMeetJS from '../lib-jitsi-meet';
import { updateSettings } from '../settings';

import logger from './logger';

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
 * Filters audio devices from a list of MediaDeviceInfo objects.
 *
 * @param {Array<MediaDeviceInfo>} devices - Unfiltered media devices.
 * @private
 * @returns {Array<MediaDeviceInfo>} Filtered audio devices.
 */
export function filterAudioDevices(devices: Object[]): Object {
    return devices.filter(device => device.kind === 'audioinput');
}

/**
 * We want to strip any device details that are not very user friendly, like usb ids put in brackets at the end.
 *
 * @param {string} label - Device label to format.
 *
 * @returns {string} - Formatted string.
 */
export function formatDeviceLabel(label: string) {

    let formattedLabel = label;

    // Remove braked description at the end as it contains non user friendly strings i.e.
    // Microsoft® LifeCam HD-3000 (045e:0779:31dg:d1231)
    const ix = formattedLabel.lastIndexOf('(');

    if (ix !== -1) {
        formattedLabel = formattedLabel.substr(0, ix);
    }

    return formattedLabel;
}

/**
 * Returns a list of objects containing all the microphone device ids and labels.
 *
 * @param {Object} state - The state of the application.
 * @returns {Object[]}
 */
export function getAudioInputDeviceData(state: Object) {
    return state['features/base/devices'].availableDevices.audioInput.map(
        ({ deviceId, label }) => {
            return {
                deviceId,
                label
            };
        });
}

/**
 * Returns a list of objectes containing all the output device ids and labels.
 *
 * @param {Object} state - The state of the application.
 * @returns {Object[]}
 */
export function getAudioOutputDeviceData(state: Object) {
    return state['features/base/devices'].availableDevices.audioOutput.map(
        ({ deviceId, label }) => {
            return {
                deviceId,
                label
            };
        });
}

/**
 * Returns a list of all the camera device ids.
 *
 * @param {Object} state - The state of the application.
 * @returns {string[]}
 */
export function getVideoDeviceIds(state: Object) {
    return state['features/base/devices'].availableDevices.videoInput.map(({ deviceId }) => deviceId);
}

/**
 * Returns true if there are devices of a specific type.
 *
 * @param {Object} state - The state of the application.
 * @param {string} type - The type of device: VideoOutput | audioOutput | audioInput.
 *
 * @returns {boolean}
 */
export function hasAvailableDevices(state: Object, type: string) {
    return state['features/base/devices'].availableDevices[type].length > 0;
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

    logger.debug(`setAudioOutputDevice: ${String(newLabel)}[${newId}]`);

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
