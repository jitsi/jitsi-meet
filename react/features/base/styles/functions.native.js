// @flow

import { Dimensions, useWindowDimensions, Platform } from 'react-native';
import {
    JANE_WELCOME_PAGE_DESGIN_MOCKUP_HEIGHT,
    JANE_WELCOME_PAGE_DESGIN_MOCKUP_WIDTH,
    type StyleType
} from './functions.any';
import JaneWelcomePageSizeHelper from './janeWelcomePageSizeHelper';

export * from './functions.any';

const isPad = Platform.isPad;

/**
 * Initializes a new JaneWelcomePageSizeHelper instance here.
 */
export const sizeHelper = new JaneWelcomePageSizeHelper({
    mockUpWidth: JANE_WELCOME_PAGE_DESGIN_MOCKUP_WIDTH,
    mockUpHeight: JANE_WELCOME_PAGE_DESGIN_MOCKUP_HEIGHT
});

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
