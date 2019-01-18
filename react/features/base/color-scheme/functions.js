// @flow

import { toState } from '../redux';

import defaultScheme from './defaultScheme';

/**
 * Creates a color schemed style object applying the color scheme to every
 * colors in the style object prepared in a special way.
 *
 * @param {Object | Function} stateful - An object or function that can be
 * resolved to Redux state using the {@code toState} function.
 * @param {Object | Array} style - The style object or array to apply the scheme
 * to.
 * @returns {Object | Array}
 */
export function createColorSchemedStyle(
        stateful: Object | Function, style: Object | Array<Object>) {
    if (!isExternalColorSchemeApplied(stateful)) {
        // Shortcut to avoid unnecessary calculations and redux updates.
        return style;
    }

    let schemedStyle;

    if (Array.isArray(style)) {
        // The style is an array of styles, we apply the same transformation to
        // each, recursively.
        schemedStyle = [];

        for (const entry of style) {
            schemedStyle.push(createColorSchemedStyle(stateful, entry));
        }
    } else {
        // The style is an object, we create a copy of it to avoid in-place
        // modification.
        schemedStyle = {
            ...style
        };

        for (const styleName of Object.keys(schemedStyle)) {
            const styleValue = schemedStyle[styleName];

            if (typeof styleValue === 'object') {
                // The value is another style object, we apply the same
                // transformation recusively.
                schemedStyle[styleName]
                    = createColorSchemedStyle(stateful, styleValue);
            } else if (typeof styleValue === 'function') {
                // The value is a function, which indicates that it's a dynamic,
                // schemed color we need to resolve.
                schemedStyle[styleName] = getColor(stateful, styleValue());
            }
        }
    }

    return schemedStyle;
}

/**
 * Function to get the color value for the provided identifier.
 *
 * @param {Object | Function} stateful - An object or function that can be
 * resolved to Redux state using the {@code toState} function.
 * @param {string} colorDefinition - The string identifier of the color, e.g.
 * {@code appBackground}.
 * @returns {color}
 */
export function getColor(stateful: Object | Function, colorDefinition: string) {
    const colorScheme = toState(stateful)['features/base/color-scheme'];

    return {
        ...defaultScheme,
        ...colorScheme
    }[colorDefinition];
}

/**
 * Returns true if an external color scheme is applied through the API. False
 * othewise.
 *
 * @param {Object | Function} stateful - An object or function that can be
 * resolved to Redux state using the {@code toState} function.
 * @returns {boolean}
 */
export function isExternalColorSchemeApplied(stateful: Object | Function) {
    const colorScheme = toState(stateful)['features/base/color-scheme'];

    return Boolean(Object.keys(colorScheme));
}

/**
 * A special function to be used in the {@code createColorSchemedStyle} call.
 *
 * @param {string} colorDefinition - The definition of the color to mark to be
 * resolved.
 * @returns {Function}
 */
export function schemeColor(colorDefinition: string) {
    return () => colorDefinition;
}
