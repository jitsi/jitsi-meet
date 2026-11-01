import { RefObject, useEffect } from 'react';

/**
 * Keeps keyboard focus inside an open menu.
 * Tab and Shift+Tab cycle through the menu's buttons. Escape is left alone so the
 * popover can close and return focus to the button that opened the menu.
 *
 * @param {RefObject<HTMLElement | null>} panelRef - The open menu panel.
 * @param {boolean} active - Whether the menu is open.
 * @returns {void}
 */
function useMenuFocusTrap(panelRef: RefObject<HTMLElement | null>, active: boolean) {
    useEffect(() => {
        if (!active) {
            return undefined;
        }

        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key !== 'Tab') {
                return;
            }

            const panel = panelRef.current;

            if (!panel?.isConnected) {
                return;
            }

            const items = Array.from(panel.querySelectorAll<HTMLButtonElement>('button:not([disabled])'));

            if (items.length === 0) {
                return;
            }

            e.preventDefault();
            e.stopPropagation();

            const currentIndex = items.indexOf(document.activeElement as HTMLButtonElement);
            const delta = e.shiftKey ? -1 : 1;
            const nextIndex = currentIndex === -1
                ? (e.shiftKey ? items.length - 1 : 0)
                : (currentIndex + delta + items.length) % items.length;

            items[nextIndex]?.focus();
        };

        document.addEventListener('keydown', onKeyDown, true);

        return () => document.removeEventListener('keydown', onKeyDown, true);
    }, [ active, panelRef ]);
}

export default useMenuFocusTrap;
