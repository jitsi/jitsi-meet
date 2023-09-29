import { StyleType } from './functions.any';

export * from './functions.any';

/**
 * Fixes the style prop that is passed to a platform generic component based on platform specific
 * format requirements.
 *
 * @param {StyleType} style - The passed style prop to the component.
 * @returns {StyleType}
 */
export function getFixedPlatformStyle(style?: StyleType | StyleType[]) {
    if (Array.isArray(style)) {
        const _style = {};

        for (const component of style) {
            Object.assign(_style, component);
        }

        return _style;
    }

    return style;
}

/**
 * Sets the line height of a CSS Object group in pixels.
 * By default lineHeight is unitless in CSS, but not in RN.
 *
 * @param {Object} base - The base object containing the `lineHeight` property.
 * @returns {Object}
 */
export function withPixelLineHeight(base: any) {
    return {
        ...base,
        lineHeight: `${base.lineHeight}px`
    };
}
