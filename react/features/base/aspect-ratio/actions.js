/* @flow */

import { SET_ASPECT_RATIO } from './actionTypes';
import { ASPECT_RATIO_NARROW, ASPECT_RATIO_WIDE } from './constants';

/**
 * Calculates new aspect ratio for the app based on provided width and height
 * values.
 *
 * @param {number} width - The width of the app's area used on the screen.
 * @param {number} height - The height of the app's area used on the screen.
 * @returns {{
 *      type: SET_ASPECT_RATIO,
 *      aspectRatio: Symbol
 * }}
 */
export function calculateNewAspectRatio(width: number, height: number): Object {
    return {
        type: SET_ASPECT_RATIO,
        aspectRatio: width > height ? ASPECT_RATIO_WIDE : ASPECT_RATIO_NARROW
    };
}
