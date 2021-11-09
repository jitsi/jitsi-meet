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

/**
 * Overwrites recursively values from object 2 into object 1 based on common keys.
 * (Merges object2 into object1).
 *
 * @param {Object} obj1 - The object holding the merged values.
 * @param {Object} obj2 - The object to compare to and take values from.
 * @returns {void}
 */
export function overwriteRecurrsive(obj1: Object, obj2: Object) {
    Object.keys(obj2).forEach(key => {
        if (obj1.hasOwnProperty(key)) {
            if (typeof obj1[key] === 'object') {
                overwriteRecurrsive(obj1[key], obj2[key]);
            } else {
                obj1[key] = obj2[key];
            }
        }
    });
}
