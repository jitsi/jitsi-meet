import { batch } from 'react-redux';

import { ACTION_SHORTCUT_PRESSED, ACTION_SHORTCUT_RELEASED, createShortcutEvent } from '../analytics/AnalyticsEvents';
import { sendAnalytics } from '../analytics/functions';
import { IStore } from '../app/types';
import { clickOnVideo } from '../filmstrip/actions.web';
import { openSettingsDialog } from '../settings/actions.web';
import { SETTINGS_TABS } from '../settings/constants';
import { iAmVisitor } from '../visitors/functions';

import { registerShortcut } from './actions.any';
import { areKeyboardShortcutsEnabled, getKeyboardShortcuts } from './functions';
import logger from './logger';
import { getKeyboardKey, getPriorityFocusedElement } from './utils';

export * from './actions.any';

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
                handler: () => {
                    sendAnalytics(createShortcutEvent('help'));
                    dispatch(openSettingsDialog(SETTINGS_TABS.SHORTCUTS, false));
                }
            }));

            // register SPACE shortcut in two steps to insure visibility of help message
            dispatch(registerShortcut({
                character: ' ',
                helpCharacter: 'SPACE',
                helpDescription: 'keyboardShortcuts.pushToTalk',
                handler: () => {
                    sendAnalytics(createShortcutEvent('push.to.talk', ACTION_SHORTCUT_RELEASED));
                    logger.log('Talk shortcut released');
                    APP.conference.muteAudio(true);
                }
            }));

            dispatch(registerShortcut({
                character: '0',
                helpDescription: 'keyboardShortcuts.focusLocal',
                handler: () => {
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
                    handler: () => {
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
                shortcuts.get(key)?.handler(e);
            }
        };

        window.onkeydown = (e: KeyboardEvent) => {
            const state = getState();
            const enabled = areKeyboardShortcutsEnabled(state);

            if (!enabled || iAmVisitor(state)) {
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
