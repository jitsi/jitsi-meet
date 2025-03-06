import * as tokens from './Tokens.json';
import * as jitsiTokens from './jitsiTokens.json';

/**
 * Creates the color tokens based on the color theme and the association map.
 * If a key is not found in tokens, it checks jitsiTokens, and if still not found,
 * defaults to the current value.
 *
 * @param {Object} colorMap - A map between the token name and the actual color value.
 * @returns {Object}
 */
export function createColorTokens(colorMap: Object): any {
    return Object.entries(colorMap)
        .reduce((result, [ token, value ]: [any, string]) => {
            const color = jitsiTokens[value as keyof typeof jitsiTokens]
                || tokens[value as keyof typeof tokens]
                || value;

            return Object.assign(result, { [token]: color });
        }, {});
}
