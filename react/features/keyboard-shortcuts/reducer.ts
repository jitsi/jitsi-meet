import PersistenceRegistry from '../base/redux/PersistenceRegistry';
import ReducerRegistry from '../base/redux/ReducerRegistry';

import {
    DISABLE_KEYBOARD_SHORTCUTS,
    ENABLE_KEYBOARD_SHORTCUTS,
    REGISTER_KEYBOARD_SHORTCUT,
    UNREGISTER_KEYBOARD_SHORTCUT
} from './actionTypes';
import { IKeyboardShortcutsState } from './types';

/**
 * The redux subtree of this feature.
 */
const STORE_NAME = 'features/keyboard-shortcuts';

const defaultState = {
    enabled: true,
    shortcuts: new Map(),
    shortcutsHelp: new Map()
};

PersistenceRegistry.register(STORE_NAME, {
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
    case REGISTER_KEYBOARD_SHORTCUT: {
        const shortcutKey = action.shortcut.alt ? `:${action.shortcut.character}` : action.shortcut.character;

        return {
            ...state,
            shortcuts: new Map(state.shortcuts)
                .set(shortcutKey, action.shortcut),
            shortcutsHelp: action.shortcut.helpDescription
                ? new Map(state.shortcutsHelp)
                .set(action.shortcut.helpCharacter ?? shortcutKey, action.shortcut.helpDescription)
                : state.shortcutsHelp
        };
    }
    case UNREGISTER_KEYBOARD_SHORTCUT: {
        const shortcutKey = action.alt ? `:${action.character}` : action.character;
        const shortcuts = new Map(state.shortcuts);

        shortcuts.delete(shortcutKey);

        const shortcutsHelp = new Map(state.shortcutsHelp);

        shortcutsHelp.delete(shortcutKey);

        return {
            ...state,
            shortcuts,
            shortcutsHelp
        };
    }
    }

    return state;
});
