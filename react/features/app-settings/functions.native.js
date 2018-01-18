// @flow

import { isIPhoneX, Platform } from '../base/react';

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
