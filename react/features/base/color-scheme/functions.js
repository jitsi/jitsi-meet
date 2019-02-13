// @flow

/**
 * A special function to be used in the {@code createColorSchemedStyle} call,
 * that denotes that the color is a dynamic color.
 *
 * @param {string} colorDefinition - The definition of the color to mark to be
 * resolved.
 * @returns {Function}
 */
export function schemeColor(colorDefinition: string): Function {
    return () => colorDefinition;
}
