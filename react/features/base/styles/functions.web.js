// @flow

import { type StyleType } from './functions.any';

export * from './functions.any';

/**
 * Fixes the style prop that is passed to a platform generic component based on platform specific
 * format requirements.
 *
 * @param {StyleType} style - The passed style prop to the component.
 * @returns {StyleType}
 */
export function getFixedPlatformStyle(style: StyleType): StyleType {
    if (Array.isArray(style)) {
        const _style = {};

        for (const component of style) {
            Object.assign(_style, component);
        }

        return _style;
    }

    return style;
}
