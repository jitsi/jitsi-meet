import { IReduxState } from '../app/types';

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

/**
 * Returns the primary shortcut key for alternative key.
 *
 * @param {Object} state - The redux state.
 * @param {string} key - Alternative shortcut key.
 * @returns {string?} - Primary shortcut key if exists.
 */
export function getPrimaryShortcutKey(state: IReduxState, key: string): string | null {

    const { alternativeShortcutKeys } = state['features/base/config'];

    const dict = Object.fromEntries((alternativeShortcutKeys || []).map(x => [ x.alt, x.key ]));

    return dict[key];
}