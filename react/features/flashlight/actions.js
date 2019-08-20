/* @flow */

import {
    TOGGLE_FLASHLIGHT
} from './actionTypes';

/**
 * Toggles the camera flashlight.
 *
 * @returns {{
 *     type: TOGGLE_FLASHLIGHT
 * }}
 */
export function toggleFlashlight() {
    return {
        type: TOGGLE_FLASHLIGHT
    };
}
