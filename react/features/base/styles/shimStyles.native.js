/**
 * The list of the well-known style properties which may not be numbers on Web
 * but must be numbers on React Native.
 */
const WELL_KNOWN_NUMBER_PROPERTIES = [ 'height', 'width' ];

/**
 * Shim style properties to work correctly on native.
 *
 * Using this shimStyles method allows us to minimize the number of style
 * declarations that need to be set or overridden for specific platforms.
 *
 * @param {Object} styles - A dictionary of named style definitions.
 * @returns {Object}
 */
export function shimStyles(styles) {
    // Certain style properties may not be numbers on Web but must be numbers on
    // React Native. For example, height and width may be expressed in percent
    // on Web but React Native will not understand them and we will get errors
    // (at least during development). Convert such well-known properties to
    // numbers if possible; otherwise, remove them to avoid runtime errors.
    for (const k of WELL_KNOWN_NUMBER_PROPERTIES) {
        const v = styles[k];
        const typeofV = typeof v;

        if (typeofV !== 'undefined' && typeofV !== 'number') {
            const numberV = Number(v);

            if (Number.isNaN(numberV)) {
                delete styles[k];
            } else {
                styles[k] = numberV;
            }
        }
    }

    return styles;
}
