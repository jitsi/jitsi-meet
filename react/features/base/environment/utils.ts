import { MIN_FILMSTRIP_RESIZE_WIDTH } from '../../filmstrip/constants';
import Platform from '../react/Platform';

/**
 * Returns whether or not the current environment is a mobile device.
 *
 * @returns {boolean}
 */
export function isMobileBrowser() {
    return Platform.OS === 'android' || Platform.OS === 'ios';
}


/**
 * Returns whether or not the current environment is an ios mobile device.
 *
 * @returns {boolean}
 */
export function isIosMobileBrowser() {
    return Platform.OS === 'ios';
}

/**
 * Returns whether or not the current environment is an ipad device.
 *
 * @returns {boolean}
 */
export function isIpadMobileBrowser() {

    // @ts-ignore
    return isIosMobileBrowser() && Platform.isPad;
}

/**
 * Detects if the current device has touch capability.
 * This includes smartphones, tablets, and laptops with touch screens.
 *
 * @returns {boolean} True if the device supports touch events.
 */
export function isTouchDevice(): boolean {
    // Check for touch support using multiple methods for better reliability
    if (typeof window === 'undefined') {
        return false;
    }

    // Check maxTouchPoints (most reliable for modern browsers)
    if ('maxTouchPoints' in navigator) {
        return navigator.maxTouchPoints > 0;
    }

    // Fallback to older touch events check
    if ('ontouchstart' in window) {
        return true;
    }

    // Check for touch-specific media query
    if (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) {
        return true;
    }

    return false;
}

/**
 * Determines if resize functionality should be enabled based on device capabilities
 * and screen size. On touch devices, resize is only enabled for larger screens (tablets+).
 * On non-touch devices (desktop), resize is always enabled.
 *
 * @returns {boolean} True if resize functionality should be available to the user.
 */
export function shouldEnableResize(): boolean {
    const hasTouch = isTouchDevice();

    // On non-touch devices (desktop), always enable resize
    if (!hasTouch) {
        return true;
    }

    // On touch devices, only enable if screen is large enough (tablets, not phones)
    return window?.innerWidth >= MIN_FILMSTRIP_RESIZE_WIDTH;
}
