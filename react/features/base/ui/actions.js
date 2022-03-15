
import { SET_LANGUAGE_DIRECTION } from './actionTypes';

/**
 * Sets the direction of app; Whether it should be LTR or RTL.
 *
 * @param {string} direction - Direction of app.
 * @returns {{
 *     type: SET_LANGUAGE_DIRECTION,
 *     direction: string,
 * }}
 */
export function setLanguageDirection(direction) {
    return {
        type: SET_LANGUAGE_DIRECTION,
        direction
    };
}
