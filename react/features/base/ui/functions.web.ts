import { createMuiTheme } from '@material-ui/core/styles';

import { Theme } from './types';
import { createColorTokens } from './utils';

interface ThemeProps {
    breakpoints: Object;
    colorMap: Object;
    colors: Object;
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
export function createWebTheme({ font, colors, colorMap, shape, spacing, typography, breakpoints }: ThemeProps): Theme {
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
    }) as unknown as Theme;
}

/**
 * Formats the common styles object to be interpreted as proper CSS.
 *
 * @param {Object} stylesObj - The styles object.
 * @returns {Object}
 */
export function formatCommonClasses(stylesObj: Object) {
    const formatted: any = {};

    for (const [ key, value ] of Object.entries(stylesObj)) {
        formatted[`.${key}`] = value;
    }

    return formatted;
}

