/* eslint-disable @typescript-eslint/naming-convention */
import { Theme, adaptV4Theme, createTheme } from '@mui/material/styles';

import { ITypography, IPalette as Palette1 } from '../ui/types';

import { createColorTokens } from './utils';

declare module '@mui/material/styles' {
    // eslint-disable-next-line @typescript-eslint/no-empty-interface
    interface Palette extends Palette1 {}

    // eslint-disable-next-line @typescript-eslint/no-empty-interface
    interface TypographyVariants extends ITypography {}
}

interface ThemeProps {
    breakpoints: Object;
    colorMap: Object;
    font: Object;
    shape: Object;
    spacing: Array<number>;
    typography: Object;
}

/**
 * Creates a MUI theme based on local UI tokens.
 *
 * @param {Object} arg - The ui tokens.
 * @returns {Object}
 */
export function createWebTheme({ font, colorMap, shape, spacing, typography, breakpoints }: ThemeProps) {
    return createTheme(adaptV4Theme({
        spacing,
        palette: createColorTokens(colorMap),
        shape,
        typography: {
            // @ts-ignore
            font,
            ...typography
        },
        breakpoints
    }));
}

/**
 * Find the first styled ancestor component of an element.
 *
 * @param {HTMLElement|null} target - Element to look up.
 * @param {string} cssClass - Styled component reference.
 * @returns {HTMLElement|null} Ancestor.
 */
export const findAncestorByClass = (target: HTMLElement | null, cssClass: string): HTMLElement | null => {
    if (!target || target.classList.contains(cssClass)) {
        return target;
    }

    return findAncestorByClass(target.parentElement, cssClass);
};

/**
 * Checks if the passed element is visible in the viewport.
 *
 * @param {Element} element - The element.
 * @returns {boolean}
 */
export function isElementInTheViewport(element?: Element): boolean {
    if (!element) {
        return false;
    }

    if (!document.body.contains(element)) {
        return false;
    }

    const { innerHeight, innerWidth } = window;
    const { bottom, left, right, top } = element.getBoundingClientRect();

    if (bottom <= innerHeight && top >= 0 && left >= 0 && right <= innerWidth) {
        return true;
    }

    return false;
}

const enterKeyElements = [ 'select', 'textarea', 'summary', 'a' ];

/**
 * Informs whether or not the given element does something on its own when pressing the Enter key.
 *
 * This is useful to correctly submit custom made "forms" that are not using the native form element,
 * only when the user is not using an element that needs the enter key to work.
 * Note the implementation is incomplete and should be updated as needed if more complex use cases arise
 * (for example, the Tabs aria pattern is not handled).
 *
 * @param {Element} element - The element.
 * @returns {boolean}
 */
export function operatesWithEnterKey(element: Element): boolean {
    if (enterKeyElements.includes(element.tagName.toLowerCase())) {
        return true;
    }

    if (element.tagName.toLowerCase() === 'button' && element.getAttribute('role') === 'button') {
        return true;
    }

    return false;
}

/**
 * Returns a common spacing from the bottom of the page for floating elements over the video space.
 *
 * @param {Theme} theme - The current theme.
 * @param {boolean} isToolbarVisible - Whether the toolbar is visible or not.
 * @returns {number}
 */
export function getVideospaceFloatingElementsBottomSpacing(theme: Theme, isToolbarVisible: boolean) {
    return parseInt(isToolbarVisible ? theme.spacing(12) : theme.spacing(6), 10);
}
