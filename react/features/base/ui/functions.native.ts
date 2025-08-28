import { DefaultTheme } from 'react-native-paper';

import { remToPixels } from './functions.any';
import { createColorTokens } from './utils';

export * from './functions.any';

/**
 * Converts all rem to pixels in an object.
 *
 * @param {Object} obj - The object to convert rem values in.
 * @returns {Object}
 */
function convertRemValues(obj: any): any {
    const converted: { [key: string]: any; } = {};

    if (typeof obj !== 'object' || obj === null) {
        return obj;
    }

    Object.entries(obj).forEach(([ key, value ]) => {
        if (typeof value === 'string' && value.includes('rem')) {
            converted[key] = remToPixels(value);
        } else if (typeof value === 'object' && value !== null) {
            converted[key] = convertRemValues(value);
        } else {
            converted[key] = value;
        }
    });

    return converted;
}

/**
 * Creates a React Native Paper theme based on local UI tokens.
 *
 * @param {Object} arg - The ui tokens.
 * @returns {Object}
 */
export function createNativeTheme({ font, colorMap, shape, spacing, typography }: any): any {
    return {
        ...DefaultTheme,
        palette: createColorTokens(colorMap),
        shape,
        spacing,
        typography: {
            font,
            ...convertRemValues(typography)
        }
    };
}
