import { useSelector } from 'react-redux';

import { isMobileBrowser } from '../base/environment/utils';

import KeyboardShortcutsButton from './components/KeyboardShortcutsButton';
import { areKeyboardShortcutsEnabled } from './functions';

const shortcuts = {
    key: 'shortcuts',
    Content: KeyboardShortcutsButton,
    group: 4
};

/**
 * A hook that returns the keyboard shortcuts button if it is enabled and undefined otherwise.
 *
 *  @returns {Object | undefined}
 */
export function useKeyboardShortcutsButton() {
    const _areKeyboardShortcutsEnabled = useSelector(areKeyboardShortcutsEnabled);

    if (!isMobileBrowser() && _areKeyboardShortcutsEnabled) {
        return shortcuts;
    }
}
