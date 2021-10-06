// @flow

import { DefaultTheme } from 'react-native-paper';

import { createColorTokens } from './utils';

/**
 * Creates a React Native Paper theme based on local UI tokens.
 *
 * @param {Object} arg - The ui tokens.
 * @returns {Object}
 */
export function createNativeTheme({ font, colors, colorMap, shape, spacing, typography }: Object) {
    return {
        ...DefaultTheme,
        palette: createColorTokens(colorMap, colors),
        shape,
        spacing,
        typography: {
            font,
            ...typography
        }
    };
}
