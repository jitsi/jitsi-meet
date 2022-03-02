
import { SET_DIRECTION } from './actionTypes';

/**
 * Sets the direction of app; Whether it should be LTR or RTL.
 *
 * @param {string} direction - Direction of app.
 * @returns {{
 *     type: SET_DIRECTION,
 *     direction: string,
 * }}
 */
export function setDirection(direction) {
    return {
        type: SET_DIRECTION,
        direction
    };
}
