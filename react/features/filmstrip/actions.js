import {
    SET_FILMSTRIP_HOVERED,
    SET_FILMSTRIP_VISIBLE
} from './actionTypes';

/**
 * Sets if the filmstrip is currently being hovered over.
 *
 * @param {boolean} hovered - Whether or not the filmstrip is currently being
 * hovered over.
 * @returns {{
 *     type: SET_FILMSTRIP_HOVERED,
 *     hovered: boolean
 * }}
 */
export function setFilmstripHovered(hovered) {
    return {
        type: SET_FILMSTRIP_HOVERED,
        hovered
    };
}

/**
 * Sets if the filmstrip should be visible.
 *
 * @param {boolean} visible - Whether the filmstrip should be visible.
 * @returns {{
 *     type: SET_FILMSTRIP_VISIBLE,
 *     visible: boolean
 * }}
 */
export function setFilmstripVisible(visible) {
    return {
        type: SET_FILMSTRIP_VISIBLE,
        visible
    };
}
