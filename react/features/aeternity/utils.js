import { getLocalParticipant } from '../base/participants';

/**
 * Check if the string is an aeternity account nubmer or chain name.
 *
* @param {string} str - String to check.
* @returns {boolean}
 */
export function isAccountOrChainName(str) {
    const regExp = /^ak_[A-Za-z0-9]{48,50}$|^[A-Za-z0-9]+\.chain$/;

    return regExp.test(str);
}

/**
 * Returns true if local participant name is an aeternity address.
 *
 * @param {Object} state - The state of the app.
 * @returns {boolean}
 */
export function localParticipantHasAeternityName(state) {
    const localParticipant = getLocalParticipant(state);

    if (localParticipant && localParticipant.name) {
        return isAccountOrChainName(localParticipant.name);
    }

    return false;
}

/**
 * Returns true if site is embeded in an iframe.
 *
 * @returns {boolean}
 */
export function isInIframe() {
    try {
        return window.self !== window.top;
    } catch (e) {
        return true;
    }
}

/**
 * Returns true if user is connected to web wallet.
 *
 * @param {Object} state - The state of the app.
 * @returns {boolean}
 */
export function isWalletJWTSet(state) {
    return state['features/base/jwt'].jwt;
}
