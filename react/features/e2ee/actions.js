// @flow

import {
    SET_EVERYONE_ENABLED_E2EE,
    SET_EVERYONE_SUPPORT_E2EE,
    SET_MAX_MODE,
    SET_MEDIA_ENCRYPTION_KEY,
    TOGGLE_E2EE } from './actionTypes';

/**
 * Dispatches an action to enable / disable E2EE.
 *
 * @param {boolean} enabled - Whether E2EE is to be enabled or not.
 * @returns {Object}
 */
export function toggleE2EE(enabled: boolean) {
    return {
        type: TOGGLE_E2EE,
        enabled
    };
}

/**
 * Set new value whether everyone has E2EE enabled.
 *
 * @param {boolean} everyoneEnabledE2EE - The new value.
 * @returns {{
 *     type: SET_EVERYONE_ENABLED_E2EE,
 *     everyoneEnabledE2EE: boolean
 * }}
 */
export function setEveryoneEnabledE2EE(everyoneEnabledE2EE: boolean) {
    return {
        type: SET_EVERYONE_ENABLED_E2EE,
        everyoneEnabledE2EE
    };
}

/**
 * Set new value whether everyone support E2EE.
 *
 * @param {boolean} everyoneSupportE2EE - The new value.
 * @returns {{
 *     type: SET_EVERYONE_SUPPORT_E2EE,
 *     everyoneSupportE2EE: boolean
 * }}
 */
export function setEveryoneSupportE2EE(everyoneSupportE2EE: boolean) {
    return {
        type: SET_EVERYONE_SUPPORT_E2EE,
        everyoneSupportE2EE
    };
}

/**
 * Dispatches an action to set E2EE maxMode.
 *
 * @param {string} maxMode - The new value.
 * @returns {Object}
 */
export function setE2EEMaxMode(maxMode: string) {
    return {
        type: SET_MAX_MODE,
        maxMode
    };
}

/**
 * Dispatches an action to set media encryption key.
 *
 * @param {Object} keyInfo - Json containing key information.
 * @param {string} [keyInfo.encryptionKey] - The exported encryption key.
 * @param {number} [keyInfo.index] - The index of the encryption key.
 * @returns {{
 *     type: SET_MEDIA_ENCRYPTION_KEY,
 *     keyInfo: Object
 * }}
 */
export function setMediaEncryptionKey(keyInfo: Object) {
    return {
        type: SET_MEDIA_ENCRYPTION_KEY,
        keyInfo
    };
}
