// @flow

import { Dimensions } from 'react-native';

import Platform from './Platform';

const IPHONEX_HEIGHT = 812;
const IPHONEX_WIDTH = 375;
const IPHONE_OFFSET = 20;
const IPHONEX_OFFSET = 44;

/**
 * Determines the offset to be used for the device. This uses a custom
 * implementation to minimize empty area around screen, especially on iPhone X.
 *
 * @returns {number}
 */
export function getSafetyOffset() {
    if (Platform.OS === 'android') {
        // Android doesn't need offset, except the Essential phone. Should be
        // addressed later with a generic solution.
        return 0;
    }

    return isIPhoneX() ? IPHONEX_OFFSET : IPHONE_OFFSET;
}

/**
 * Determines if the device is an iPad or not.
 *
 * @returns {boolean}
 */
export function isIPad() {
    const { height, width } = Dimensions.get('window');

    return (
        Platform.OS === 'ios'
            && (Math.max(height, width) / Math.min(height, width)) < 1.6);
}

/**
 * Determines if it's an iPhone X or not.
 *
 * @returns {boolean}
 */
export function isIPhoneX() {
    const { height, width } = Dimensions.get('window');

    return (
        Platform.OS === 'ios'
            && ((height === IPHONEX_HEIGHT && width === IPHONEX_WIDTH)
                || (height === IPHONEX_WIDTH && width === IPHONEX_HEIGHT)));
}
