// @flow

import Logger from '@jitsi/logger';

const logger = Logger.getLogger(__filename);

/**
 * Returns Promise that resolves with result an list of available devices.
 *
 * @param {Transport} transport - The @code{Transport} instance responsible for
 * the external communication.
 * @returns {Promise}
 */
export function getAvailableDevices(transport: Object) {
    return transport.sendRequest({
        type: 'devices',
        name: 'getAvailableDevices'
    }).catch(e => {
        logger.error(e);

        return {};
    });
}

/**
 * Returns Promise that resolves with current selected devices.
 *
 * @param {Transport} transport - The @code{Transport} instance responsible for
 * the external communication.
 * @returns {Promise}
 */
export function getCurrentDevices(transport: Object) {
    return transport.sendRequest({
        type: 'devices',
        name: 'getCurrentDevices'
    }).catch(e => {
        logger.error(e);

        return {};
    });
}

/**
 * Returns Promise that resolves with true if the device change is available
 * and with false if not.
 *
 * @param {Transport} transport - The @code{Transport} instance responsible for
 * the external communication.
 * @param {string} [deviceType] - Values - 'output', 'input' or undefined.
 * Default - 'input'.
 * @returns {Promise}
 */
export function isDeviceChangeAvailable(transport: Object, deviceType: string) {
    return transport.sendRequest({
        deviceType,
        type: 'devices',
        name: 'isDeviceChangeAvailable'
    });
}

/**
 * Returns Promise that resolves with true if the device list is available
 * and with false if not.
 *
 * @param {Transport} transport - The @code{Transport} instance responsible for
 * the external communication.
 * @returns {Promise}
 */
export function isDeviceListAvailable(transport: Object) {
    return transport.sendRequest({
        type: 'devices',
        name: 'isDeviceListAvailable'
    });
}

/**
 * Returns Promise that resolves with true if multiple audio input is supported
 * and with false if not.
 *
 * @param {Transport} transport - The @code{Transport} instance responsible for
 * the external communication.
 * @returns {Promise}
 */
export function isMultipleAudioInputSupported(transport: Object) {
    return transport.sendRequest({
        type: 'devices',
        name: 'isMultipleAudioInputSupported'
    });
}

/**
 * Sets the audio input device to the one with the label or id that is passed.
 *
 * @param {Transport} transport - The @code{Transport} instance responsible for
 * the external communication.
 * @param {string} label - The label of the new device.
 * @param {string} id - The id of the new device.
 * @returns {Promise}
 */
export function setAudioInputDevice(transport: Object, label: string, id: string) {
    return _setDevice(transport, {
        id,
        kind: 'audioinput',
        label
    });
}

/**
 * Sets the audio output device to the one with the label or id that is passed.
 *
 * @param {Transport} transport - The @code{Transport} instance responsible for
 * the external communication.
 * @param {string} label - The label of the new device.
 * @param {string} id - The id of the new device.
 * @returns {Promise}
 */
export function setAudioOutputDevice(transport: Object, label: string, id: string) {
    return _setDevice(transport, {
        id,
        kind: 'audiooutput',
        label
    });
}

/**
 * Sets the currently used device to the one that is passed.
 *
 * @param {Transport} transport - The @code{Transport} instance responsible for
 * the external communication.
 * @param {Object} device - The new device to be used.
 * @returns {Promise}
 */
function _setDevice(transport: Object, device) {
    return transport.sendRequest({
        type: 'devices',
        name: 'setDevice',
        device
    });
}

/**
 * Sets the video input device to the one with the label or id that is passed.
 *
 * @param {Transport} transport - The @code{Transport} instance responsible for
 * the external communication.
 * @param {string} label - The label of the new device.
 * @param {string} id - The id of the new device.
 * @returns {Promise}
 */
export function setVideoInputDevice(transport: Object, label: string, id: string) {
    return _setDevice(transport, {
        id,
        kind: 'videoinput',
        label
    });
}
