// @flow

import { SET_ASPECT_RATIO } from './actionTypes';
import { ASPECT_RATIO_NARROW, ASPECT_RATIO_WIDE } from './constants';

/**
 * Sets the aspect ratio of the app's user interface based on specific width and
 * height.
 *
 * @param {number} width - The width of the app's user interface.
 * @param {number} height - The height of the app's user interface.
 * @returns {{
 *      type: SET_ASPECT_RATIO,
 *      aspectRatio: Symbol
 * }}
 */
export function setAspectRatio(width: number, height: number): Object {
    return {
        type: SET_ASPECT_RATIO,
        aspectRatio: width < height ? ASPECT_RATIO_NARROW : ASPECT_RATIO_WIDE
    };
}
