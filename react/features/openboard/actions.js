/* @flow */

import { TOGGLE_SHARE_WHITEBOARD } from './actionTypes';

/**
 * toggles sharing whiteboard.
 *
 * @public
 * @returns {{
 *     type: TOGGLE_SHARE_WHITEBOARD
 * }}
 */
export function toggleShareWhiteBoard(): Object {
    return {
        type: TOGGLE_SHARE_WHITEBOARD
    };
}

