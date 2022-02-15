import { OPEN_KEYBOARD_SHORTCUTS_DIALOG } from './actionTypes.ts';

/**
 * Opens the dialog showing available keyboard shortcuts.
 *
 * @returns {{
 *     type: OPEN_KEYBOARD_SHORTCUTS_DIALOG
 * }}
 */
export function openKeyboardShortcutsDialog() {
    return {
        type: OPEN_KEYBOARD_SHORTCUTS_DIALOG
    };
}
