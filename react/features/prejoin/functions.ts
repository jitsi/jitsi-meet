import { IState } from '../app/types';
import { getRoomName } from '../base/conference/functions';
import { getDialOutStatusUrl, getDialOutUrl } from '../base/config/functions.web';
import { isAudioMuted, isVideoMutedByUser } from '../base/media/functions';

/**
 * Selector for the visibility of the 'join by phone' button.
 *
 * @param {IState} state - The state of the app.
 * @returns {boolean}
 */
export function isJoinByPhoneButtonVisible(state: IState): boolean {
    return Boolean(getDialOutUrl(state) && getDialOutStatusUrl(state));
}

/**
 * Selector for determining if the device status strip is visible or not.
 *
 * @param {IState} state - The state of the app.
 * @returns {boolean}
 */
export function isDeviceStatusVisible(state: IState): boolean {
    return !(isAudioMuted(state) && isVideoMutedByUser(state))
    && !state['features/base/config'].startSilent;
}

/**
 * Selector for determining if the display name is mandatory.
 *
 * @param {IState} state - The state of the app.
 * @returns {boolean}
 */
export function isDisplayNameRequired(state: IState): boolean {
    return Boolean(state['features/prejoin']?.isDisplayNameRequired
        || state['features/base/config']?.requireDisplayName);
}

/**
 * Selector for determining if the prejoin display name field is visible.
 *
 * @param {IState} state - The state of the app.
 * @returns {boolean}
 */
export function isPrejoinDisplayNameVisible(state: IState): boolean {
    return !state['features/base/config'].prejoinConfig?.hideDisplayName;
}

/**
 * Returns the text for the prejoin status bar.
 *
 * @param {IState} state - The state of the app.
 * @returns {string}
 */
export function getDeviceStatusText(state: IState): string {
    return state['features/prejoin']?.deviceStatusText;
}

/**
 * Returns the type of the prejoin status bar: 'ok'|'warning'.
 *
 * @param {IState} state - The state of the app.
 * @returns {string}
 */
export function getDeviceStatusType(state: IState): string {
    return state['features/prejoin']?.deviceStatusType;
}

/**
 * Returns the 'conferenceUrl' used for dialing out.
 *
 * @param {IState} state - The state of the app.
 * @returns {string}
 */
export function getDialOutConferenceUrl(state: IState): string {
    return `${getRoomName(state)}@${state['features/base/config'].hosts?.muc}`;
}

/**
 * Selector for getting the dial out country.
 *
 * @param {IState} state - The state of the app.
 * @returns {Object}
 */
export function getDialOutCountry(state: IState) {
    return state['features/prejoin'].dialOutCountry;
}

/**
 * Selector for getting the dial out number (without prefix).
 *
 * @param {IState} state - The state of the app.
 * @returns {string}
 */
export function getDialOutNumber(state: IState): string {
    return state['features/prejoin'].dialOutNumber;
}

/**
 * Selector for getting the dial out status while calling.
 *
 * @param {IState} state - The state of the app.
 * @returns {string}
 */
export function getDialOutStatus(state: IState): string {
    return state['features/prejoin'].dialOutStatus;
}

/**
 * Returns the full dial out number (containing country code and +).
 *
 * @param {IState} state - The state of the app.
 * @returns {string}
 */
export function getFullDialOutNumber(state: IState): string {
    const dialOutNumber = getDialOutNumber(state);
    const country = getDialOutCountry(state);

    return `+${country.dialCode}${dialOutNumber}`;
}

/**
 * Selector for getting the error if any while creating streams.
 *
 * @param {IState} state - The state of the app.
 * @returns {string}
 */
export function getRawError(state: IState): string {
    return state['features/prejoin']?.rawError;
}

/**
 * Selector for getting the visibility state for the 'JoinByPhoneDialog'.
 *
 * @param {IState} state - The state of the app.
 * @returns {boolean}
 */
export function isJoinByPhoneDialogVisible(state: IState): boolean {
    return state['features/prejoin']?.showJoinByPhoneDialog;
}

/**
 * Returns true if the prejoin page is enabled and no flag
 * to bypass showing the page is present.
 *
 * @param {IState} state - The state of the app.
 * @returns {boolean}
 */
export function isPrejoinPageVisible(state: IState): boolean {
    return Boolean(navigator.product !== 'ReactNative'
        && state['features/base/config'].prejoinConfig?.enabled
        && state['features/prejoin']?.showPrejoin
        && !(state['features/base/config'].enableForcedReload && state['features/prejoin'].skipPrejoinOnReload));
}

/**
 * Returns true if we should auto-knock in case lobby is enabled for the room.
 *
 * @param {IState} state - The state of the app.
 * @returns {boolean}
 */
export function shouldAutoKnock(state: IState): boolean {
    const { iAmRecorder, iAmSipGateway, autoKnockLobby, prejoinConfig } = state['features/base/config'];
    const { userSelectedSkipPrejoin } = state['features/base/settings'];
    const isPrejoinEnabled = prejoinConfig?.enabled;

    return Boolean(((isPrejoinEnabled && !userSelectedSkipPrejoin)
            || autoKnockLobby || (iAmRecorder && iAmSipGateway))
        && !state['features/lobby'].knocking);
}
