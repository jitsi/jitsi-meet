// @flow

import { createMuiTheme } from '@material-ui/core/styles';

/**
 * Creates the color tokens based on the color theme and the association map.
 * If a key is not fonund in the association map it defaults to the current value.
 *
 * @param {Object} colorMap - A map between the token name and the actual color value.
 * @param {Object} colors - An object containing all the theme colors.
 * @returns {Object}
 */
function createColorTokens(colorMap: Object, colors: Object): Object {
    return Object.entries(colorMap)
        .reduce((result, [ token, value ]) =>
            Object.assign(result, { [token]: colors[value] || value }), {});
}

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
