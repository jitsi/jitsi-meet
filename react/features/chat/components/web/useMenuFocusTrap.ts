import { useCallback } from 'react';

/**
 * Keeps Tab inside an open menu.
 * Call from the panel's onKeyDown. Escape is left alone so the popover can close.
 *
 * @returns {Function} Keydown handler for the menu panel.
 */
function useMenuFocusTrap() {
    return useCallback((event: React.KeyboardEvent<HTMLElement>) => {
        if (event.key !== 'Tab') {
            return;
        }

        const items = Array.from(
            event.currentTarget.querySelectorAll<HTMLButtonElement>('button:not([disabled])')
        );

        if (items.length === 0) {
            return;
        }

        event.preventDefault();

        const currentIndex = items.indexOf(document.activeElement as HTMLButtonElement);
        const delta = event.shiftKey ? -1 : 1;
        const nextIndex = currentIndex === -1
            ? (event.shiftKey ? items.length - 1 : 0)
            : (currentIndex + delta + items.length) % items.length;

        items[nextIndex]?.focus();
    }, []);
}

export default useMenuFocusTrap;
