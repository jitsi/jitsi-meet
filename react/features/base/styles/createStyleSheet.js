import { shimStyles } from './shimStyles';

/**
 * Create a style sheet using the provided style definitions.
 *
 * @param {Object} styles - A dictionary of named style definitions.
 * @param {Object} [overrides={}] - Optional set of additional (often
 * platform-dependent/specific) style definitions that will override the base
 * (often platform-independent) styles.
 * @returns {Object}
 */
export function createStyleSheet(styles, overrides = {}) {
    const combinedStyles = {};

    for (const k of Object.keys(styles)) {
        combinedStyles[k]
            = shimStyles({
                ...styles[k],
                ...overrides[k]
            });
    }

    return combinedStyles;
}
