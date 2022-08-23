/**
 * Creates the color tokens based on the color theme and the association map.
 * If a key is not found in the association map it defaults to the current value.
 *
 * @param {Object} colorMap - A map between the token name and the actual color value.
 * @param {Object} colors - An object containing all the theme colors.
 * @returns {Object}
 */
export function createColorTokens(colorMap: Object, colors: Object): any {
    return Object.entries(colorMap)
        .reduce((result, [ token, value ]: [any, keyof Object]) =>
            Object.assign(result, { [token]: colors[value] || value }), {});
}
