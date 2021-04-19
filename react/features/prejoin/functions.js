// @flow

import { getRoomName } from '../base/conference';
import { getDialOutStatusUrl, getDialOutUrl } from '../base/config/functions';
import { isAudioMuted, isVideoMutedByUser } from '../base/media';

/**
 * Selector for the visibility of the 'join by phone' button.
 *
 * @param {Object} state - The state of the app.
 * @returns {boolean}
 */
export function isJoinByPhoneButtonVisible(state: Object): boolean {
    return Boolean(getDialOutUrl(state) && getDialOutStatusUrl(state));
}

/**
 * Selector for determining if the device status strip is visible or not.
 *
 * @param {Object} state - The state of the app.
 * @returns {boolean}
 */
export function isDeviceStatusVisible(state: Object): boolean {
    return !(isAudioMuted(state) && isVideoMutedByUser(state))
    && !state['features/base/config'].startSilent;
}

/**
 * Selector for determining if the display name is mandatory.
 *
 * @param {Object} state - The state of the app.
 * @returns {boolean}
 */
export function isDisplayNameRequired(state: Object): boolean {
    return state['features/prejoin'].isDisplayNameRequired
        || state['features/base/config'].requireDisplayName;
}

/**
 * Selector for determining if the user has chosen to skip prejoin page.
 *
 * @param {Object} state - The state of the app.
 * @returns {boolean}
 */
export function isPrejoinSkipped(state: Object) {
    return state['features/prejoin'].userSelectedSkipPrejoin;
}

/**
 * Returns the text for the prejoin status bar.
 *
 * @param {Object} state - The state of the app.
 * @returns {string}
 */
export function getDeviceStatusText(state: Object): string {
    return state['features/prejoin']?.deviceStatusText;
}

/**
 * Returns the type of the prejoin status bar: 'ok'|'warning'.
 *
 * @param {Object} state - The state of the app.
 * @returns {string}
 */
export function getDeviceStatusType(state: Object): string {
    return state['features/prejoin']?.deviceStatusType;
}

/**
 * Returns the 'conferenceUrl' used for dialing out.
 *
 * @param {Object} state - The state of the app.
 * @returns {string}
 */
export function getDialOutConferenceUrl(state: Object): string {
    return `${getRoomName(state)}@${state['features/base/config'].hosts.muc}`;
}

/**
 * Selector for getting the dial out country.
 *
 * @param {Object} state - The state of the app.
 * @returns {Object}
 */
export function getDialOutCountry(state: Object): Object {
    return state['features/prejoin'].dialOutCountry;
}

/**
 * Selector for getting the dial out number (without prefix).
 *
 * @param {Object} state - The state of the app.
 * @returns {string}
 */
export function getDialOutNumber(state: Object): string {
    return state['features/prejoin'].dialOutNumber;
}

/**
 * Selector for getting the dial out status while calling.
 *
 * @param {Object} state - The state of the app.
 * @returns {string}
 */
export function getDialOutStatus(state: Object): string {
    return state['features/prejoin'].dialOutStatus;
}

/**
 * Returns the full dial out number (containing country code and +).
 *
 * @param {Object} state - The state of the app.
 * @returns {string}
 */
export function getFullDialOutNumber(state: Object): string {
    const dialOutNumber = getDialOutNumber(state);
    const country = getDialOutCountry(state);

    return `+${country.dialCode}${dialOutNumber}`;
}

/**
 * Selector for getting the error if any while creating streams.
 *
 * @param {Object} state - The state of the app.
 * @returns {string}
 */
export function getRawError(state: Object): string {
    return state['features/prejoin']?.rawError;
}

/**
 * Selector for getting the visibility state for the 'JoinByPhoneDialog'.
 *
 * @param {Object} state - The state of the app.
 * @returns {boolean}
 */
export function isJoinByPhoneDialogVisible(state: Object): boolean {
    return state['features/prejoin']?.showJoinByPhoneDialog;
}

/**
 * Returns true if the prejoin page is enabled and no flag
 * to bypass showing the page is present.
 *
 * @param {Object} state - The state of the app.
 * @returns {boolean}
 */
export function isPrejoinPageEnabled(state: Object): boolean {
    return navigator.product !== 'ReactNative'
        && state['features/base/config'].prejoinPageEnabled
        && !state['features/base/settings'].userSelectedSkipPrejoin
        && !(state['features/base/config'].enableForcedReload && state['features/prejoin'].skipPrejoinOnReload);
}

/**
 * Returns true if the prejoin page is visible & active.
 *
 * @param {Object} state - The state of the app.
 * @returns {boolean}
 */
export function isPrejoinPageVisible(state: Object): boolean {
    return isPrejoinPageEnabled(state) && state['features/prejoin']?.showPrejoin;
}

/**
 * Returns true if we should auto-knock in case lobby is enabled for the room.
 *
 * @param {Object} state - The state of the app.
 * @returns {boolean}
 */
export function shouldAutoKnock(state: Object): boolean {
    const { iAmRecorder, iAmSipGateway } = state['features/base/config'];

    return (isPrejoinPageEnabled(state) || (iAmRecorder && iAmSipGateway))
        && !state['features/lobby'].knocking;
}
