// @flow
import { CONFIG_WHITELIST } from '../config';
import { toState } from '../redux';
import { parseURLParams } from '../util';

import { DEFAULT_SERVER_URL } from './constants';

/**
 * Returns the effective value of a configuration/preference/setting by applying
 * a precedence among the values specified by JWT, URL, settings,
 * and config.
 *
 * @param {Object|Function} stateful - The redux state object or
 * {@code getState} function.
 * @param {string} propertyName - The name of the
 * configuration/preference/setting (property) to retrieve.
 * @param {{
 *     config: boolean,
 *     jwt: boolean,
 *     settings: boolean,
 *     urlParams: boolean
 * }} [sources] - A set/structure of {@code boolean} flags indicating the
 * configuration/preference/setting sources to consider/retrieve values from.
 * @returns {any}
 */
export function getPropertyValue(
        stateful: Object | Function,
        propertyName: string,
        sources?: Object
) {
    // Default values don't play nicely with partial objects and we want to make
    // the function easy to use without exhaustively defining all flags:
    sources = { // eslint-disable-line no-param-reassign
        // Defaults:
        config: true,
        jwt: true,
        settings: true,
        urlParams: true,

        ...sources
    };

    // Precedence: jwt -> urlParams -> settings -> config.

    const state = toState(stateful);

    // jwt
    if (sources.jwt) {
        const value = state['features/base/jwt'][propertyName];

        if (typeof value !== 'undefined') {
            return value[propertyName];
        }
    }

    // urlParams
    if (sources.urlParams) {
        if (CONFIG_WHITELIST.indexOf(propertyName) !== -1) {
            const urlParams
                = parseURLParams(state['features/base/connection'].locationURL);
            const value = urlParams[`config.${propertyName}`];

            if (typeof value !== 'undefined') {
                return value;
            }
        }
    }

    // settings
    if (sources.settings) {
        const value = state['features/base/settings'][propertyName];

        if (typeof value !== 'undefined') {
            return value;
        }
    }

    // config
    if (sources.config) {
        const value = state['features/base/config'][propertyName];

        if (typeof value !== 'undefined') {
            return value;
        }
    }

    return undefined;
}

/**
 * Gets the currently configured server URL.
 *
 * @param {Object|Function} stateful - The redux state object or
 * {@code getState} function.
 * @returns {string} - The currently configured server URL.
 */
export function getServerURL(stateful: Object | Function) {
    const state = toState(stateful);

    return state['features/base/settings'].serverURL || DEFAULT_SERVER_URL;
}

/**
 * Searches known devices for a matching deviceId and fall back to matching on
 * label. Returns the stored preferred cameraDeviceId if a match is not found.
 *
 * @param {Object|Function} stateful - The redux state object or
 * {@code getState} function.
 * @returns {string}
 */
export function getUserSelectedCameraDeviceId(stateful: Object | Function) {
    const state = toState(stateful);
    const {
        userSelectedCameraDeviceId,
        userSelectedCameraDeviceLabel
    } = state['features/base/settings'];
    const { videoInput } = state['features/base/devices'].availableDevices;

    return _getUserSelectedDeviceId({
        availableDevices: videoInput,

        // Operating systems may append " #{number}" somewhere in the label so
        // find and strip that bit.
        matchRegex: /\s#\d*(?!.*\s#\d*)/,
        userSelectedDeviceId: userSelectedCameraDeviceId,
        userSelectedDeviceLabel: userSelectedCameraDeviceLabel,
        replacement: ''
    });
}

/**
 * Searches known devices for a matching deviceId and fall back to matching on
 * label. Returns the stored preferred micDeviceId if a match is not found.
 *
 * @param {Object|Function} stateful - The redux state object or
 * {@code getState} function.
 * @returns {string}
 */
export function getUserSelectedMicDeviceId(stateful: Object | Function) {
    const state = toState(stateful);
    const {
        userSelectedMicDeviceId,
        userSelectedMicDeviceLabel
    } = state['features/base/settings'];
    const { audioInput } = state['features/base/devices'].availableDevices;

    return _getUserSelectedDeviceId({
        availableDevices: audioInput,

        // Operating systems may append " ({number}-" somewhere in the label so
        // find and strip that bit.
        matchRegex: /\s\(\d*-\s(?!.*\s\(\d*-\s)/,
        userSelectedDeviceId: userSelectedMicDeviceId,
        userSelectedDeviceLabel: userSelectedMicDeviceLabel,
        replacement: ' ('
    });
}

/**
 * Searches known devices for a matching deviceId and fall back to matching on
 * label. Returns the stored preferred audioOutputDeviceId if a match is not found.
 *
 * @param {Object|Function} stateful - The redux state object or
 * {@code getState} function.
 * @returns {string}
 */
export function getUserSelectedOutputDeviceId(stateful: Object | Function) {
    const state = toState(stateful);
    const {
        userSelectedAudioOutputDeviceId,
        userSelectedAudioOutputDeviceLabel
    } = state['features/base/settings'];
    const { audioOutput } = state['features/base/devices'].availableDevices;

    return _getUserSelectedDeviceId({
        availableDevices: audioOutput,
        matchRegex: undefined,
        userSelectedDeviceId: userSelectedAudioOutputDeviceId,
        userSelectedDeviceLabel: userSelectedAudioOutputDeviceLabel,
        replacement: undefined
    });
}

/**
 * A helper function to abstract the logic for choosing which device ID to
 * use. Falls back to fuzzy matching on label if a device ID match is not found.
 *
 * @param {Object} options - The arguments used to match find the preferred
 * device ID from available devices.
 * @param {Array<string>} options.availableDevices - The array of currently
 * available devices to match against.
 * @param {Object} options.matchRegex - The regex to use to find strings
 * appended to the label by the operating system. The matches will be replaced
 * with options.replacement, with the intent of matching the same device that
 * might have a modified label.
 * @param {string} options.userSelectedDeviceId - The device ID the participant
 * prefers to use.
 * @param {string} options.userSelectedDeviceLabel - The label associated with the
 * device ID the participant prefers to use.
 * @param {string} options.replacement - The string to use with
 * options.matchRegex to remove identifies added to the label by the operating
 * system.
 * @private
 * @returns {string} The preferred device ID to use for media.
 */
function _getUserSelectedDeviceId(options) {
    const {
        availableDevices,
        matchRegex,
        userSelectedDeviceId,
        userSelectedDeviceLabel,
        replacement
    } = options;

    // If there is no label at all, there is no need to fall back to checking
    // the label for a fuzzy match.
    if (!userSelectedDeviceLabel || !userSelectedDeviceId) {
        return userSelectedDeviceId;
    }

    const foundMatchingBasedonDeviceId = availableDevices.find(
        candidate => candidate.deviceId === userSelectedDeviceId);

    // Prioritize matching the deviceId
    if (foundMatchingBasedonDeviceId) {
        return userSelectedDeviceId;
    }

    const strippedDeviceLabel
        = matchRegex ? userSelectedDeviceLabel.replace(matchRegex, replacement)
            : userSelectedDeviceLabel;
    const foundMatchBasedOnLabel = availableDevices.find(candidate => {
        const { label } = candidate;

        if (!label) {
            return false;
        } else if (strippedDeviceLabel === label) {
            return true;
        }

        const strippedCandidateLabel
            = label.replace(matchRegex, replacement);

        return strippedDeviceLabel === strippedCandidateLabel;
    });

    return foundMatchBasedOnLabel
        ? foundMatchBasedOnLabel.deviceId : userSelectedDeviceId;
}

