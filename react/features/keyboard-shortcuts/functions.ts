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
