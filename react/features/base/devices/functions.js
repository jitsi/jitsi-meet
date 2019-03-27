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
    if (APP.conference._localTracksInitialized) {
        return true;
    }

    for (const type of [ 'audioInput', 'audioOutput', 'videoInput' ]) {
        if (state['features/base/devices'][type].find(d => Boolean(d.label))) {
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
 * @returns {string|undefined}
 */
export function getDeviceIdByLabel(state: Object, label: string) {
    const types = [ 'audioInput', 'audioOutput', 'videoInput' ];

    for (const type of types) {
        const device
            = state['features/base/devices'][type].find(d => d.label === label);

        if (device) {
            return device.deviceId;
        }
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
 * @returns {Promise}
 */
export function setAudioOutputDeviceId(
        newId: string = 'default',
        dispatch: Function): Promise<*> {
    return JitsiMeetJS.mediaDevices.setAudioOutputDevice(newId)
        .then(() =>
            dispatch(updateSettings({
                audioOutputDeviceId: newId
            })));
}
