import { useEffect } from 'react';
import { useDispatch } from 'react-redux';

import { toggleDialog } from '../base/dialog/actions';
import { registerShortcut, unregisterShortcut } from '../keyboard-shortcuts/actions';

import CommandPalette from './components/web/CommandPalette';

const SHORTCUT_KEY = '-P';

/**
 * Hook that registers the Ctrl+Shift+P keyboard shortcut to open the
 * command palette.
 *
 * @returns {void}
 */
export function useCommandPaletteShortcut(): void {
    const dispatch = useDispatch();

    useEffect(() => {
        dispatch(registerShortcut({
            character: SHORTCUT_KEY,
            helpCharacter: 'Ctrl+Shift+P',
            helpDescription: 'commandPalette.openPalette',
            handler: () => { // eslint-disable-line @typescript-eslint/no-empty-function
                // Handled via keydown listener to support Ctrl+Shift
            }
        }));

        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.code === 'KeyP') {
                e.preventDefault();
                dispatch(toggleDialog('CommandPalette', CommandPalette));
            }
        };

        window.addEventListener('keydown', handleKeyDown);

        return () => {
            dispatch(unregisterShortcut(SHORTCUT_KEY));
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, []);
}
