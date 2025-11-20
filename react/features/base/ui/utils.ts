import { merge } from 'lodash-es';

import * as jitsiTokens from './jitsiTokens.json';
import * as tokens from './tokens.json';

/**
 * Creates the color tokens based on the color theme and the association map.
 *
 * @param {Object} colorMap - A map between the token name and the actual color value.
 * @returns {Object}
 */
export function createColorTokens(colorMap: Object): any {
    const allTokens = merge({}, tokens, jitsiTokens);

    return Object.entries(colorMap)
        .reduce((result, [ token, value ]: [any, string]) => {
            const color = allTokens[value as keyof typeof allTokens] || value;

            return Object.assign(result, { [token]: color });
        }, {});
}

/**
 * Create the typography tokens based on the typography theme and the association map.
 *
 * @param {Object} typography - A map between the token name and the actual typography value.
 * @returns {Object}
 */
export function createTypographyTokens(typography: Object): any {
    const allTokens = merge({}, tokens, jitsiTokens);

    return Object.entries(typography)
        .reduce((result, [ token, value ]: [any, any]) => {
            let typographyValue = value;

            if (typeof value === 'string') {
                typographyValue = allTokens[value as keyof typeof allTokens] || value;
            }

            return Object.assign(result, { [token]: typographyValue });
        }, {});
}
