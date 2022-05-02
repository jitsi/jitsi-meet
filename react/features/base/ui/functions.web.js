// @flow

import { createMuiTheme } from '@material-ui/core/styles';

import { createColorTokens } from './utils';

/**
 * Creates a MUI theme based on local UI tokens.
 *
 * @param {Object} arg - The ui tokens.
 * @returns {Object}
 */
export function createWebTheme({ font, colors, colorMap, shape, spacing, typography, breakpoints }: Object) {
    return createMuiTheme({
        props: {
            // disable ripple effect on buttons globally
            MuiButtonBase: {
                disableRipple: true
            }
        },

        // use token spacing array
        spacing
    }, {
        palette: createColorTokens(colorMap, colors),
        shape,
        typography: {
            font,
            ...typography
        },
        breakpoints
    });
}

/**
 * Formats the common styles object to be interpreted as proper CSS.
 *
 * @param {Object} stylesObj - The styles object.
 * @returns {Object}
 */
export function formatCommonClasses(stylesObj: Object) {
    const formatted = {};

    for (const [ key, value ] of Object.entries(stylesObj)) {
        formatted[`.${key}`] = value;
    }

    return formatted;
}

