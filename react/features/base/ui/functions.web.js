// @flow

import { createMuiTheme } from '@material-ui/core/styles';

import { createColorTokens } from './utils';

/**
 * Creates a MUI theme based on local UI tokens.
 *
 * @param {Object} arg - The ui tokens.
 * @returns {Object}
 */
export function createWebTheme({ font, colors, colorMap, shape, spacing, typography }: Object) {
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
        }
    });
}
