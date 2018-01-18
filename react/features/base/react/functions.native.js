// @flow

import { Dimensions } from 'react-native';

import Platform from './Platform';

const IPHONEX_HEIGHT = 812;
const IPHONEX_WIDTH = 375;

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
