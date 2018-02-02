// @flow

import { SET_ASPECT_RATIO, SET_REDUCED_UI } from './actionTypes';
import { ASPECT_RATIO_NARROW, ASPECT_RATIO_WIDE } from './constants';

import type { Dispatch } from 'redux';

/**
 * Size threshold for determining if we are in reduced UI mode or not.
 */
const REDUCED_UI_THRESHOLD = 240;

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

/**
 * Sets the "reduced UI" property. In reduced UI mode some components will
 * be hidden if there is no space to render them.
 *
 * @param {number} width - Current usable width.
 * @param {number} height - Current usable height.
 * @returns {{
 *     type: SET_REDUCED_UI,
 *     reducedUI: boolean
 * }}
 */
export function setReducedUI(width: number, height: number) {
    return (dispatch: Dispatch<*>, getState: Function) => {
        const reducedUI = Math.min(width, height) < REDUCED_UI_THRESHOLD;

        if (reducedUI !== getState()['features/base/responsive-ui'].reducedUI) {
            return dispatch({
                type: SET_REDUCED_UI,
                reducedUI
            });
        }
    };
}
