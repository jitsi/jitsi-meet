// @flow

import { SET_ASPECT_RATIO } from './actionTypes';
import { ASPECT_RATIO_NARROW, ASPECT_RATIO_WIDE } from './constants';

import type { Dispatch } from 'redux';

/**
 * Sets the aspect ratio of the app's user interface based on specific width and
 * height.
 *
 * @param {number} width - The width of the app's user interface.
 * @param {number} height - The height of the app's user interface.
 * @returns {{
 *     type: SET_ASPECT_RATIO,
 *     aspectRatio: Symbol
 * }}
 */
export function setAspectRatio(width: number, height: number): Object {
    return (dispatch: Dispatch<*>, getState: Function) => {
        // Don't change the aspect ratio if width and height are the same, that
        // is, if we transition to a 1:1 aspect ratio.
        if (width !== height) {
            const aspectRatio
                = width < height ? ASPECT_RATIO_NARROW : ASPECT_RATIO_WIDE;

            if (aspectRatio
                    !== getState()['features/base/responsive-ui'].aspectRatio) {
                return dispatch({
                    type: SET_ASPECT_RATIO,
                    aspectRatio
                });
            }
        }
    };
}
