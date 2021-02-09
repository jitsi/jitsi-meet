// @flow

import { useWindowDimensions, StatusBar, Platform } from 'react-native';
import DeviceInfo from 'react-native-device-info';

import {
    JANE_WELCOME_PAGE_DESIGN_HEIGHT,
    JANE_WELCOME_PAGE_DESIGN_WIDTH,
    JANE_WELCOME_PAGE_DESIGN_SAFE_AREA_VIEW_PADDING
} from './functions.any';
import JaneWelcomePageSizeHelper from './janeWelcomePageSizeHelper';

export * from './functions.any';

/**
 * Initializes a new JaneWelcomePageSizeHelper instance here.
 */
export const sizeHelper = new JaneWelcomePageSizeHelper({
    designWidth: JANE_WELCOME_PAGE_DESIGN_WIDTH,
    designHeight: JANE_WELCOME_PAGE_DESIGN_HEIGHT,
    designSafeAreaPadding: JANE_WELCOME_PAGE_DESIGN_SAFE_AREA_VIEW_PADDING
});

/**
 * Get the Status Bar height on iOS and Android. For iOS,
 * the calculation is done to get the different StatusBar
 * height when >= iPhone X (with notch) is used.
 *
 * @returns {number}
 */
export function getStatusBarHeight() {
    return Platform.select({
        ios: isIPhoneX() ? 44 : 20,
        android: StatusBar.currentHeight,
        default: 0
    });

}

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
export function isIPhoneX() {
    return DeviceInfo.hasNotch();
}

// eslint-disable-next-line require-jsdoc
export function logDimensions() {
    console.log(useWindowDimensions());
}
