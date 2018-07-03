// @flow

import { parseURLParams } from '../config';
import { toState } from '../redux';

import { DEFAULT_SERVER_URL } from './constants';

/**
 * Searches known devices for a matching deviceId and fall back to matching on
 * label. Returns the stored preferred cameraDeviceId if a match is not found.
 *
 * @param {Object|Function} stateful - The redux state object or
 * {@code getState} function.
 * @returns {string}
 */
export function getPreferredCameraDeviceId(stateful: Object | Function) {
    const state = toState(stateful);
    const {
        cameraDeviceId,
        cameraDeviceLabel
    } = state['features/base/settings'];

    // If there is no label at all, there is no need to fall back to checking
    // the label for a fuzzy match. And then if there is no cameraDeviceId,
    // there is no searching to perform.
    if (!cameraDeviceLabel || !cameraDeviceId) {
        return cameraDeviceId;
    }

    const { videoInput } = state['features/base/devices'];
    const foundMatchingBasedonDeviceId = videoInput.find(
        candidate => candidate.deviceId === cameraDeviceId);

    // Prioritize matching the deviceId of the camera.
    if (foundMatchingBasedonDeviceId) {
        return cameraDeviceId;
    }

    // Fall back to doing a partial match of the label if a matching deviceId
    // has not been found. Operating systems may append " #{number}" somewhere
    // in the label so find and strip that bit.
    const lastSpacePoundNumRegex = /\s#\d*(?!.*\s#\d*)/;
    const replacement = '';
    const preferredDeviceLabel
        = cameraDeviceLabel.replace(lastSpacePoundNumRegex, replacement);
    const foundMatchBasedOnLabel = videoInput.find(candidate => {
        const { label } = candidate;

        if (!label) {
            return false;
        } else if (cameraDeviceLabel === label) {
            return true;
        }

        const candidateLabel
            = label.replace(lastSpacePoundNumRegex, replacement);

        return preferredDeviceLabel === candidateLabel;
    });

    return foundMatchBasedOnLabel
        ? foundMatchBasedOnLabel.deviceId : cameraDeviceId;
}

/**
 * Searches known devices for a matching deviceId and fall back to matching on
 * label. Returns the stored preferred micDeviceId if a match is not found.
 *
 * @param {Object|Function} stateful - The redux state object or
 * {@code getState} function.
 * @returns {string}
 */
export function getPreferredMicDeviceId(stateful: Object | Function) {
    const state = toState(stateful);
    const {
        micDeviceId,
        micDeviceLabel
    } = state['features/base/settings'];

    // If there is no label at all, there is no need to fall back to checking
    // the label for a fuzzy match.
    if (!micDeviceLabel || !micDeviceId) {
        return micDeviceId;
    }

    const { audioInput } = state['features/base/devices'];
    const foundMatchingBasedonDeviceId = audioInput.find(
        candidate => candidate.deviceId === micDeviceId);

    // Prioritize matching the deviceId of the microphone.
    if (foundMatchingBasedonDeviceId) {
        return micDeviceId;
    }

    // Fall back to doing a partial match of the label if a matching deviceId
    // has not been found. Operating systems may append " ({number}-" somewhere
    // in the label so find and strip that bit.
    const lastSpaceParenNumDashRegex = /\s\(\d*-\s(?!.*\s\(\d*-\s)/;
    const replacement = ' (';
    const preferredDeviceLabel
        = micDeviceLabel.replace(lastSpaceParenNumDashRegex, replacement);
    const foundMatchBasedOnLabel = audioInput.find(candidate => {
        const { label } = candidate;

        if (!label) {
            return false;
        } else if (micDeviceLabel === label) {
            return true;
        }

        const candidateLabel
            = label.replace(lastSpaceParenNumDashRegex, replacement);

        return preferredDeviceLabel === candidateLabel;
    });

    return foundMatchBasedOnLabel
        ? foundMatchBasedOnLabel.deviceId : micDeviceId;
}

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
        const urlParams
            = parseURLParams(state['features/base/connection'].locationURL);
        const value = urlParams[`config.${propertyName}`];

        if (typeof value !== 'undefined') {
            return value;
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
