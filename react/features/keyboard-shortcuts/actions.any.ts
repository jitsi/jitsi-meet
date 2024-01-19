import { AnyAction } from 'redux';

import {
    DISABLE_KEYBOARD_SHORTCUTS,
    ENABLE_KEYBOARD_SHORTCUTS,
    REGISTER_KEYBOARD_SHORTCUT,
    UNREGISTER_KEYBOARD_SHORTCUT
} from './actionTypes';
import { IKeyboardShortcut } from './types';

/**
 * Action to register a new shortcut.
 *
 * @param {IKeyboardShortcut} shortcut - The shortcut to register.
 * @returns {AnyAction}
*/
export const registerShortcut = (shortcut: IKeyboardShortcut): AnyAction => {
    return {
        type: REGISTER_KEYBOARD_SHORTCUT,
        shortcut
    };
};

/**
* Action to unregister a shortcut.
*
* @param {string} character - The character of the shortcut to unregister.
* @param {boolean} altKey - Whether the shortcut used altKey.
* @returns {AnyAction}
*/
export const unregisterShortcut = (character: string, altKey = false): AnyAction => {
    return {
        altKey,
        type: UNREGISTER_KEYBOARD_SHORTCUT,
        character
    };
};

/**
 * Action to enable keyboard shortcuts.
 *
 * @returns {AnyAction}
 */
export const enableKeyboardShortcuts = (): AnyAction => {
    return {
        type: ENABLE_KEYBOARD_SHORTCUTS
    };
};


/**
 * Action to enable keyboard shortcuts.
 *
 * @returns {AnyAction}
 */
export const disableKeyboardShortcuts = (): AnyAction => {
    return {
        type: DISABLE_KEYBOARD_SHORTCUTS
    };
};
