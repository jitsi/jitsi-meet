import { IReduxState } from '../app/types';
import { browser } from '../base/lib-jitsi-meet';

/**
 * Returns whether or not Ctrl+Alt aliases for reaction shortcuts are enabled.
 *
 * The setting is Firefox-only and defaults to enabled for existing users whose
 * persisted state does not contain it yet.
 *
 * @param {Object} state - The redux state.
 * @returns {boolean} - Whether or not the aliases are enabled.
 */
export function areCtrlAltReactionShortcutsEnabled(state: IReduxState) {
    return browser.isFirefox()
        && state['features/keyboard-shortcuts'].ctrlAltReactionShortcutsEnabled !== false;
}

/**
 * Returns whether or not the keyboard shortcuts are enabled.
 *
 * @param {Object} state - The redux state.
 * @returns {boolean} - Whether or not the keyboard shortcuts are enabled.
 */
export function areKeyboardShortcutsEnabled(state: IReduxState) {
    return state['features/keyboard-shortcuts'].enabled;
}

/**
 * Returns the keyboard shortcuts map.
 *
 * @param {Object} state - The redux state.
 * @returns {Map} - The keyboard shortcuts map.
 */
export function getKeyboardShortcuts(state: IReduxState) {
    return state['features/keyboard-shortcuts'].shortcuts;
}

/**
 * Returns the keyboard shortcuts help descriptions.
 *
 * @param {Object} state - The redux state.
 * @returns {Map} - The keyboard shortcuts help descriptions.
 */
export function getKeyboardShortcutsHelpDescriptions(state: IReduxState) {
    return state['features/keyboard-shortcuts'].shortcutsHelp;
}
