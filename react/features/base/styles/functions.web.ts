import { StyleType } from './functions.any';

export * from './functions.any';

const BASE_FONT_SIZE = 16;

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
    let lineHeight = base.lineHeight;

    if (typeof lineHeight === 'string') {
        lineHeight = remToPixels(base.lineHeight);
    }

    return {
        ...base,
        lineHeight: `${lineHeight}px`
    };
}

/**
 * Converts a rem value to pixels.
 *
 * @param {string | number} rem - The rem value to convert.
 * @returns {number} - The converted pixel value.
 */
export function remToPixels(rem: string | number): number {
    return Math.round(parseFloat(String(rem)) * BASE_FONT_SIZE);
}
