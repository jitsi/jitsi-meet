import { MIN_FILMSTRIP_RESIZE_WIDTH } from '../../filmstrip/constants';

/**
 * Detects if the current device has touch capability.
 * This includes smartphones, tablets, and laptops with touch screens.
 *
 * @returns {boolean} True if the device supports touch events.
 */
export function isTouchDevice(): boolean {
    // Check maxTouchPoints (most reliable for modern browsers)
    if ('maxTouchPoints' in navigator) {
        return navigator.maxTouchPoints > 0;
    }

    return false;
}

/**
 * Determines if resize functionality should be enabled based on device capabilities
 * and screen size. On touch devices, resize is only enabled for larger screens.
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

    // On touch devices, only enable if screen is large enough.
    return window?.innerWidth >= MIN_FILMSTRIP_RESIZE_WIDTH;
}

export * from './utils.any';
