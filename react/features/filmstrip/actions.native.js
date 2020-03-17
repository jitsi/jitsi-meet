// @flow

import {
    SET_FILMSTRIP_ENABLED,
    SET_FILMSTRIP_HOVERED,
    SET_FILMSTRIP_VISIBLE
} from './actionTypes';

/**
 * Sets whether the filmstrip is enabled.
 *
 * @param {boolean} enabled - Whether the filmstrip is enabled.
 * @returns {{
 *     type: SET_FILMSTRIP_ENABLED,
 *     enabled: boolean
 * }}
 */
export function setFilmstripEnabled(enabled: boolean) {
    return {
        type: SET_FILMSTRIP_ENABLED,
        enabled
    };
}

/**
 * Sets whether the filmstrip is being hovered (over).
 *
 * @param {boolean} hovered - Whether the filmstrip is being hovered (over).
 * @returns {{
 *     type: SET_FILMSTRIP_HOVERED,
 *     hovered: boolean
 * }}
 */
export function setFilmstripHovered(hovered: boolean) {
    return {
        type: SET_FILMSTRIP_HOVERED,
        hovered
    };
}

/**
 * Sets whether the filmstrip is visible.
 *
 * @param {boolean} visible - Whether the filmstrip is visible.
 * @returns {{
 *     type: SET_FILMSTRIP_VISIBLE,
 *     visible: boolean
 * }}
 */
export function setFilmstripVisible(visible: boolean) {
    return {
        type: SET_FILMSTRIP_VISIBLE,
        visible
    };
}
