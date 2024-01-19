import { IReduxState, IStore } from '../../app/types';
import JitsiMeetJS from '../lib-jitsi-meet';
import { updateSettings } from '../settings/actions';
import { ISettingsState } from '../settings/reducer';
import { setNewAudioOutputDevice } from '../sounds/functions.web';
import { parseURLParams } from '../util/parseURLParams';

import { DEVICE_LABEL_PREFIXES_TO_IGNORE } from './constants';
import logger from './logger';
import { IDevicesState } from './types';

export * from './functions.any';

const webrtcKindToJitsiKindTranslator = {
    audioinput: 'audioInput',
    audiooutput: 'audioOutput',
    videoinput: 'videoInput'
};

/**
 * Detects the use case when the labels are not available if the A/V permissions
 * are not yet granted.
 *
 * @param {Object} state - The redux state.
 * @returns {boolean} - True if the labels are already initialized and false
 * otherwise.
 */
export function areDeviceLabelsInitialized(state: IReduxState) {
    // TODO: Replace with something that doesn't use APP when the conference.js logic is reactified.
    if (APP.conference._localTracksInitialized) {
        return true;
    }

    for (const type of [ 'audioInput', 'audioOutput', 'videoInput' ]) {
        const availableDevices = state['features/base/devices'].availableDevices;

        if ((availableDevices[type as keyof typeof availableDevices] || []).find(d => Boolean(d.label))) {
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
 * Finds the real device id of the default device of the given type.
 *
 * @param {Object} state - The redux state.
 * @param {*} kind - The type of the device. One of "audioInput",
 * "audioOutput", and "videoInput". Also supported is all lowercase versions
 * of the preceding types.
 * @returns {string|undefined}
 */
export function getDefaultDeviceId(state: IReduxState, kind: string) {
    const kindToSearch = webrtcKindToJitsiKindTranslator[kind as keyof typeof webrtcKindToJitsiKindTranslator] || kind;
    const availableDevices = state['features/base/devices'].availableDevices;
    const defaultDevice = (availableDevices[kindToSearch as keyof typeof availableDevices] || [])
        .find(d => d.deviceId === 'default');

    // Find the device with a matching group id.
    const matchingDevice = (availableDevices[kindToSearch as keyof typeof availableDevices] || [])
        .find(d => d.deviceId !== 'default' && d.groupId === defaultDevice?.groupId);

    if (matchingDevice) {
        return matchingDevice.deviceId;
    }
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
export function getDeviceIdByLabel(state: IReduxState, label: string, kind: string) {
    const kindToSearch = webrtcKindToJitsiKindTranslator[kind as keyof typeof webrtcKindToJitsiKindTranslator] || kind;

    const availableDevices = state['features/base/devices'].availableDevices;
    const device
        = (availableDevices[kindToSearch as keyof typeof availableDevices] || [])
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
export function getDeviceLabelById(state: IReduxState, id: string, kind: string) {
    const kindToSearch = webrtcKindToJitsiKindTranslator[kind as keyof typeof webrtcKindToJitsiKindTranslator] || kind;

    const availableDevices = state['features/base/devices'].availableDevices;
    const device
        = (availableDevices[kindToSearch as keyof typeof availableDevices] || [])
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
export function getDevicesFromURL(state: IReduxState) {
    const urlParams
        = parseURLParams(state['features/base/connection'].locationURL ?? '');

    const audioOutput = urlParams['devices.audioOutput'];
    const videoInput = urlParams['devices.videoInput'];
    const audioInput = urlParams['devices.audioInput'];

    if (!audioOutput && !videoInput && !audioInput) {
        return undefined;
    }

    const devices: IDevicesState['availableDevices'] = {};

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
export function groupDevicesByKind(devices: MediaDeviceInfo[]): IDevicesState['availableDevices'] {
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
export function filterAudioDevices(devices: MediaDeviceInfo[]) {
    return devices.filter(device => device.kind === 'audioinput');
}

/**
 * Filters the devices that start with one of the prefixes from DEVICE_LABEL_PREFIXES_TO_IGNORE.
 *
 * @param {MediaDeviceInfo[]} devices - The devices to be filtered.
 * @returns {MediaDeviceInfo[]} - The filtered devices.
 */
export function filterIgnoredDevices(devices: MediaDeviceInfo[] = []) {
    const ignoredDevices: MediaDeviceInfo[] = [];
    const filteredDevices = devices.filter(device => {
        if (!device.label) {
            return true;
        }

        if (DEVICE_LABEL_PREFIXES_TO_IGNORE.find(prefix => device.label?.startsWith(prefix))) {
            ignoredDevices.push(device);

            return false;
        }

        return true;
    });

    return {
        filteredDevices,
        ignoredDevices
    };
}

/**
 * Check if the passed device arrays are different.
 *
 * @param {MediaDeviceInfo[]} devices1 - Array with devices to be compared.
 * @param {MediaDeviceInfo[]} devices2 - Array with devices to be compared.
 * @returns {boolean} - True if the device arrays are different and false otherwise.
*/
export function areDevicesDifferent(devices1: MediaDeviceInfo[] = [], devices2: MediaDeviceInfo[] = []) {
    if (devices1.length !== devices2.length) {
        return true;
    }

    for (let i = 0; i < devices1.length; i++) {
        const device1 = devices1[i];
        const found = devices2.find(({ deviceId, groupId, kind, label }) =>
            device1.deviceId === deviceId
            && device1.groupId === groupId
            && device1.kind === kind
            && device1.label === label
        );

        if (!found) {
            return true;
        }
    }

    return false;
}

/**
 * Flattens the availableDevices from redux.
 *
 * @param {IDevicesState.availableDevices} devices - The available devices from redux.
 * @returns {MediaDeviceInfo[]} - The flattened array of devices.
 */
export function flattenAvailableDevices(
        { audioInput = [], audioOutput = [], videoInput = [] }: IDevicesState['availableDevices']) {
    return audioInput.concat(audioOutput).concat(videoInput);
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
export function getAudioInputDeviceData(state: IReduxState) {
    return state['features/base/devices'].availableDevices.audioInput?.map(
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
export function getAudioOutputDeviceData(state: IReduxState) {
    return state['features/base/devices'].availableDevices.audioOutput?.map(
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
export function getVideoDeviceIds(state: IReduxState) {
    return state['features/base/devices'].availableDevices.videoInput?.map(({ deviceId }) => deviceId);
}

/**
 * Converts an array of device info objects into string.
 *
 * @param {MediaDeviceInfo[]} devices - The devices.
 * @returns {string}
 */
function devicesToStr(devices?: MediaDeviceInfo[]) {
    return devices?.map(device => `\t\t${device.label}[${device.deviceId}]`).join('\n');
}

/**
 * Logs an array of devices.
 *
 * @param {MediaDeviceInfo[]} devices - The array of devices.
 * @param {string} title - The title that will be printed in the log.
 * @returns {void}
 */
export function logDevices(devices: MediaDeviceInfo[], title = '') {
    const deviceList = groupDevicesByKind(devices);
    const audioInputs = devicesToStr(deviceList.audioInput);
    const audioOutputs = devicesToStr(deviceList.audioOutput);
    const videoInputs = devicesToStr(deviceList.videoInput);

    logger.debug(`${title}:\n`
        + `audioInput:\n${audioInputs}\n`
        + `audioOutput:\n${audioOutputs}\n`
        + `videoInput:\n${videoInputs}`);
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
        newId = 'default',
        dispatch: IStore['dispatch'],
        userSelection = false,
        newLabel?: string): Promise<any> {

    logger.debug(`setAudioOutputDevice: ${String(newLabel)}[${newId}]`);

    if (!JitsiMeetJS.mediaDevices.isDeviceChangeAvailable('output')) {
        logger.warn('Adjusting audio output is not supported');

        return Promise.resolve();
    }

    return JitsiMeetJS.mediaDevices.setAudioOutputDevice(newId)
        .then(() => {
            dispatch(setNewAudioOutputDevice(newId));
            const newSettings: Partial<ISettingsState> = {
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
