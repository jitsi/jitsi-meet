/* @flow */
import Platform from '../react/Platform';

import { ColorPalette } from './components';

declare type StyleSheet = Object;
export type StyleType = StyleSheet | Array<StyleSheet>;

/**
 * RegExp pattern for long HEX color format.
 */
const HEX_LONG_COLOR_FORMAT
    = /^#([0-9A-F]{2,2})([0-9A-F]{2,2})([0-9A-F]{2,2})$/i;

/**
 * RegExp pattern for short HEX color format.
 */
const HEX_SHORT_COLOR_FORMAT
    = /^#([0-9A-F]{1,1})([0-9A-F]{1,1})([0-9A-F]{1,1})$/i;

/**
 * RegExp pattern for RGB color format.
 */
const RGB_COLOR_FORMAT = /^rgb\((\d{1,3}),\s*(\d{1,3}),\s*(\d{1,3})\)$/i;

/**
 * The list of the well-known style properties which may not be numbers on Web
 * but must be numbers on React Native.
 *
 * @private
 */
const _WELL_KNOWN_NUMBER_PROPERTIES = [ 'height', 'width' ];

/**
 * Combines the given 2 styles into a single one.
 *
 * @param {StyleType} a - An object or array of styles.
 * @param {StyleType} b - An object or array of styles.
 * @private
 * @returns {StyleType} - The merged styles.
 */
export function combineStyles(a: StyleType, b: StyleType): StyleType {
    const result = [];

    if (a) {
        if (Array.isArray(a)) {
            result.push(...a);
        } else {
            result.push(a);
        }
    }

    if (b) {
        if (Array.isArray(b)) {
            result.push(...b);
        } else {
            result.push(b);
        }
    }

    return result;
}

/**
 * Create a style sheet using the provided style definitions.
 *
 * @param {StyleSheet} styles - A dictionary of named style definitions.
 * @param {StyleSheet} [overrides={}] - Optional set of additional (often
 * platform-dependent/specific) style definitions that will override the base
 * (often platform-independent) styles.
 * @returns {StyleSheet}
 */
export function createStyleSheet(
        styles: StyleSheet, overrides: StyleSheet = {}): StyleSheet {
    const combinedStyles = {};

    for (const k of Object.keys(styles)) {
        combinedStyles[k]
            = _shimStyles({
                ...styles[k],
                ...overrides[k]
            });
    }

    return combinedStyles;
}

/**
 * Works around a bug in react-native or react-native-webrtc on Android which
 * causes Views overlaying RTCView to be clipped. Even though we (may) display
 * multiple RTCViews, it is enough to apply the fix only to a View with a
 * bounding rectangle containing all RTCviews and their overlaying Views.
 *
 * @param {StyleSheet} styles - An object which represents a stylesheet.
 * @public
 * @returns {StyleSheet}
 */
export function fixAndroidViewClipping<T: StyleSheet>(styles: T): T {
    if (Platform.OS === 'android') {
        styles.borderColor = ColorPalette.appBackground;
        styles.borderWidth = 1;
    }

    return styles;
}

/**
 * Returns an rgba format of the provided color if it's in hex or rgb format.
 *
 * NOTE: The function will return the same color if it's not in one of those
 * two formats (e.g. 'white').
 *
 * @param {string} color - The string representation of the color in rgb or hex
 * format.
 * @param {number} alpha - The alpha value to apply.
 * @returns {string}
 */
export function getRGBAFormat(color: string, alpha: number): string {
    let match = color.match(HEX_LONG_COLOR_FORMAT);

    if (match) {
        return `#${match[1]}${match[2]}${match[3]}${_getAlphaInHex(alpha)}`;
    }

    match = color.match(HEX_SHORT_COLOR_FORMAT);
    if (match) {
        return `#${match[1]}${match[1]}${match[2]}${match[2]}${match[3]}${
            match[3]}${_getAlphaInHex(alpha)}`;
    }

    match = color.match(RGB_COLOR_FORMAT);
    if (match) {
        return `rgba(${match[1]}, ${match[2]}, ${match[3]}, ${alpha})`;
    }

    return color;
}

/**
 * Converts an [0..1] alpha value into HEX.
 *
 * @param {number} alpha - The alpha value to convert.
 * @returns {string}
 */
function _getAlphaInHex(alpha: number): string {
    return Number(Math.round(255 * alpha)).toString(16)
        .padStart(2, '0');
}

/**
 * Shims style properties to work correctly on native. Allows us to minimize the
 * number of style declarations that need to be set or overridden for specific
 * platforms.
 *
 * @param {StyleSheet} styles - An object which represents a stylesheet.
 * @private
 * @returns {StyleSheet}
 */
function _shimStyles<T: StyleSheet>(styles: T): T {
    // Certain style properties may not be numbers on Web but must be numbers on
    // React Native. For example, height and width may be expressed in percent
    // on Web but React Native will not understand them and we will get errors
    // (at least during development). Convert such well-known properties to
    // numbers if possible; otherwise, remove them to avoid runtime errors.
    for (const k of _WELL_KNOWN_NUMBER_PROPERTIES) {
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
