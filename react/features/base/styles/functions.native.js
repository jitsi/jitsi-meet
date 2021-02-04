// @flow

import { Dimensions, useWindowDimensions, Platform, PixelRatio } from 'react-native';
import { type StyleType } from './functions.any';

export * from './functions.any';

const isPad = Platform.isPad;
const { height, width } = Dimensions.get('window');

// Because the dimension (height & width) from the design mockup is not standard.
// design mockup iphone dimension : (390 X 844)
// design mockup iPad dimension : (811 X 1080)
// we need to re-calculate the pixel size to adapt different iphone/ipads devices.

const JANE_INTRO_PAGE_DESGIN_MOCKUP_HEIGHT = isPad ? 1080 : 844;
const JANE_INTRO_PAGE_DESGIN_MOCKUP_WIDTH = isPad ? 811 : 390;

// safe area view padding top + padding bottom
const SAFE_AREA_VIEW_PADDING = isPad ? 0 : deviceHasNotch() ? 78 : 34;
const SCALE_WIDTH_RATIO = width / JANE_INTRO_PAGE_DESGIN_MOCKUP_WIDTH;
const SCALE_HEIGHT_RATIO = (height - SAFE_AREA_VIEW_PADDING) / JANE_INTRO_PAGE_DESGIN_MOCKUP_HEIGHT;

/**
 * Fixes the style prop that is passed to a platform generic component based on platform specific
 * format requirements.
 *
 * @param {StyleType} style - The passed style prop to the component.
 * @returns {StyleType}
 */
export function getFixedPlatformStyle(style: StyleType): StyleType {
    // There is nothing to do on mobile - yet.

    return style;
}

/**
 * Detect Screen Notch for iphone.
 *
 * @returns {boolean}
 */
export function deviceHasNotch() {
    return Dimensions.get('window').height > 811 && !isPad;
}

// eslint-disable-next-line require-jsdoc
export function logDimensions() {
    console.log(useWindowDimensions());
}

/**
 * Calculate actual horizontal direction size from the the design mockup mesaurements.
 *
 * @param {number}  size - Number.
 * @returns {number}
 */
export function calcPixelByWidthRatio(size) {
    if (!size) {
        return 0;
    }

    return PixelRatio.roundToNearestPixel(size * SCALE_WIDTH_RATIO);
}

/**
 * Calculate actual vertical direction size from the the design mockup mesaurements for device.
 *
 * @param {number}  size - Number.
 * @returns {number}
 */
export function calcPixelByHeightRatio(size) {
    if (!size) {
        return 0;
    }

    return PixelRatio.roundToNearestPixel(size * SCALE_HEIGHT_RATIO);
}

/**
 * Calculate actual font size from the the design mockup mesaurements for device.
 * Return the actual horizontal direction size if the iphone has notch.
 *
 * @param {number}  size - Number.
 * @returns {number}
 */
export function calcFontSize(size) {
    if (!deviceHasNotch()) {
        return calcPixelByHeightRatio(size);
    }

    return calcPixelByWidthRatio(size);
}
