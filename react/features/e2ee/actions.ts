import {
    PARTICIPANT_VERIFIED,
    SET_MAX_MODE,
    SET_MEDIA_ENCRYPTION_KEY,
    START_VERIFICATION,
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

/**
 * Dispatches an action to start participant e2ee verficiation process.
 *
 * @param {string} pId - The participant id.
 * @returns {{
 *     type: START_VERIFICATION,
 *     pId: string
 * }}
 */
export function startVerification(pId: string) {
    return {
        type: START_VERIFICATION,
        pId
    };
}

/**
 * Dispatches an action to set participant e2ee verification status.
 *
 * @param {string} pId - The participant id.
 * @param {boolean} isVerified - The verifcation status.
 * @returns {{
 *     type: PARTICIPANT_VERIFIED,
 *     pId: string,
 *     isVerified: boolean
 * }}
 */
export function participantVerified(pId: string, isVerified: boolean) {
    return {
        type: PARTICIPANT_VERIFIED,
        pId,
        isVerified
    };
}
