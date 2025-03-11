import * as jitsiTokens from './jitsiTokens.json';
import * as neoTokens from './neoTokens.json';

/**
 * Creates the color tokens based on the color theme and the association map.
 * If a key is not found in neoTokens, it checks jitsiTokens, and if still not found,
 * defaults to the current value.
 *
 * @param {Object} colorMap - A map between the token name and the actual color value.
 * @returns {Object}
 */
export function createColorTokens(colorMap: Object): any {
    return Object.entries(colorMap)
        .reduce((result, [ token, value ]: [any, string]) => {
            const color = neoTokens[value as keyof typeof neoTokens]
                || jitsiTokens[value as keyof typeof jitsiTokens]
                || value;

            return Object.assign(result, { [token]: color });
        }, {});
}
