// @ts-ignore
import Logger from '@jitsi/logger';
import { batch } from 'react-redux';
import { AnyAction } from 'redux';

import { ACTION_SHORTCUT_PRESSED, ACTION_SHORTCUT_RELEASED, createShortcutEvent } from '../analytics/AnalyticsEvents';
import { sendAnalytics } from '../analytics/functions';
import { IStore } from '../app/types';
import { clickOnVideo } from '../filmstrip/actions.web';
import { openSettingsDialog } from '../settings/actions.web';
import { SETTINGS_TABS } from '../settings/constants';

import {
    DISABLE_KEYBOARD_SHORTCUTS,
    ENABLE_KEYBOARD_SHORTCUTS,
    REGISTER_KEYBOARD_SHORTCUT,
    UNREGISTER_KEYBOARD_SHORTCUT
} from './actionTypes';
import { areKeyboardShortcutsEnabled, getKeyboardShortcuts } from './functions';
import { IKeyboardShortcut } from './types';
import { getKeyboardKey, getPriorityFocusedElement } from './utils';

// @ts-ignore
const logger = Logger.getLogger(__filename);

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

/**
 * Initialise global shortcuts.
 * Global shortcuts are shortcuts for features that don't have a button or
 * link associated with the action. In other words they represent actions
 * triggered _only_ with a shortcut.
 *
 * @returns {Function}
 */
const initGlobalKeyboardShortcuts = () =>
    (dispatch: IStore['dispatch']) => {
        batch(() => {
            dispatch(registerShortcut({
                character: '?',
                helpDescription: 'keyboardShortcuts.toggleShortcuts',
                function: () => {
                    sendAnalytics(createShortcutEvent('help'));
                    dispatch(openSettingsDialog(SETTINGS_TABS.SHORTCUTS, false));
                }
            }));

            // register SPACE shortcut in two steps to insure visibility of help message
            dispatch(registerShortcut({
                character: ' ',
                helpCharacter: 'SPACE',
                helpDescription: 'keyboardShortcuts.pushToTalk',
                function: () => {
                    sendAnalytics(createShortcutEvent('push.to.talk', ACTION_SHORTCUT_RELEASED));
                    logger.log('Talk shortcut released');
                    APP.conference.muteAudio(true);
                }
            }));

            dispatch(registerShortcut({
                character: '0',
                helpDescription: 'keyboardShortcuts.focusLocal',
                function: () => {
                    dispatch(clickOnVideo(0));
                }
            }));

            Array(9).fill(1)
            .forEach((_, index) => {
                const num = index + 1;

                dispatch(registerShortcut({
                    character: `${num}`,

                    // only show help hint for the first shortcut
                    helpCharacter: num === 1 ? '1-9' : undefined,
                    helpDescription: num === 1 ? 'keyboardShortcuts.focusRemote' : undefined,
                    function: () => {
                        dispatch(clickOnVideo(num));
                    }
                }));
            });
        });
    };

/**
 * Initializes keyboard shortcuts.
 *
 * @returns {Function}
*/
export const initKeyboardShortcuts = () =>
    (dispatch: IStore['dispatch'], getState: IStore['getState']) => {
        dispatch(initGlobalKeyboardShortcuts());

        window.onkeyup = (e: KeyboardEvent) => {
            const state = getState();
            const enabled = areKeyboardShortcutsEnabled(state);
            const shortcuts = getKeyboardShortcuts(state);

            if (!enabled || getPriorityFocusedElement()) {
                return;
            }

            const key = getKeyboardKey(e).toUpperCase();

            if (shortcuts.has(key)) {
                shortcuts.get(key)?.function(e);
            }
        };

        window.onkeydown = (e: KeyboardEvent) => {
            const state = getState();
            const enabled = areKeyboardShortcutsEnabled(state);

            if (!enabled) {
                return;
            }

            const focusedElement = getPriorityFocusedElement();
            const key = getKeyboardKey(e).toUpperCase();

            if (key === ' ' && !focusedElement) {
                sendAnalytics(createShortcutEvent('push.to.talk', ACTION_SHORTCUT_PRESSED));
                logger.log('Talk shortcut pressed');
                APP.conference.muteAudio(false);
            } else if (key === 'ESCAPE') {
                focusedElement?.blur();
            }
        };
    };
