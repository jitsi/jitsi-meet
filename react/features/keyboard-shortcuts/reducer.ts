import PersistenceRegistry from '../base/redux/PersistenceRegistry';
import ReducerRegistry from '../base/redux/ReducerRegistry';

import {
    DISABLE_KEYBOARD_SHORTCUTS,
    ENABLE_KEYBOARD_SHORTCUTS,
    REGISTER_KEYBOARD_SHORTCUT,
    SET_CTRL_ALT_REACTION_SHORTCUTS_ENABLED,
    UNREGISTER_KEYBOARD_SHORTCUT
} from './actionTypes';
import { IKeyboardShortcutsState } from './types';
import { getShortcutKey } from './utils';

/**
 * The redux subtree of this feature.
 */
const STORE_NAME = 'features/keyboard-shortcuts';

const defaultState = {
    ctrlAltReactionShortcutsEnabled: true,
    enabled: true,
    shortcuts: new Map()
};

PersistenceRegistry.register(STORE_NAME, {
    ctrlAltReactionShortcutsEnabled: true,
    enabled: true
});

ReducerRegistry.register<IKeyboardShortcutsState>(STORE_NAME,
(state = defaultState, action): IKeyboardShortcutsState => {
    switch (action.type) {
    case ENABLE_KEYBOARD_SHORTCUTS:
        return {
            ...state,
            enabled: true
        };
    case DISABLE_KEYBOARD_SHORTCUTS:
        return {
            ...state,
            enabled: false
        };
    case SET_CTRL_ALT_REACTION_SHORTCUTS_ENABLED:
        return {
            ...state,
            ctrlAltReactionShortcutsEnabled: action.enabled
        };
    case REGISTER_KEYBOARD_SHORTCUT: {
        const { alt, character, ctrl } = action.shortcut;
        const shortcutKey = getShortcutKey(character, alt, ctrl);

        return {
            ...state,
            shortcuts: new Map(state.shortcuts)
                .set(shortcutKey, action.shortcut)
        };
    }
    case UNREGISTER_KEYBOARD_SHORTCUT: {
        const shortcutKey = getShortcutKey(action.character, action.alt, action.ctrl);
        const shortcuts = new Map(state.shortcuts);

        shortcuts.delete(shortcutKey);

        return {
            ...state,
            shortcuts
        };
    }
    }

    return state;
});
