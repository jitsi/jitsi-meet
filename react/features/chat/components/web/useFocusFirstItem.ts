import { RefObject, useEffect } from 'react';

/**
 * The popover portal stays visibility:hidden until onVisible, and focus() fails
 * until then. Keep retrying until an item has focus or the menu closes.
 *
 * @param {RefObject<HTMLElement | null>} panelRef - The open menu panel.
 * @param {boolean} active - Whether the menu is open.
 * @param {string} itemSelector - Selector for the first item to focus.
 * @returns {void}
 */
function useFocusFirstItem(
        panelRef: RefObject<HTMLElement | null>,
        active: boolean,
        itemSelector: string
) {
    useEffect(() => {
        if (!active) {
            return undefined;
        }

        let frame = 0;

        const focusFirstItem = () => {
            const panel = panelRef.current;
            const firstItem = panel?.querySelector<HTMLElement>(itemSelector);
            const activeElement = document.activeElement;
            const itemHasFocus = Boolean(activeElement instanceof HTMLElement
                && panel?.contains(activeElement)
                && activeElement.matches(itemSelector));

            if (itemHasFocus) {
                return;
            }

            if (firstItem && getComputedStyle(firstItem).visibility !== 'hidden') {
                firstItem.focus();
            }

            frame = requestAnimationFrame(focusFirstItem);
        };

        frame = requestAnimationFrame(focusFirstItem);

        return () => cancelAnimationFrame(frame);
    }, [ active, itemSelector, panelRef ]);
}

export default useFocusFirstItem;
