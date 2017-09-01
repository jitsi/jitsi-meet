import {
    SET_FILMSTRIP_HOVERED,
    SET_FILMSTRIP_VISIBILITY
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
 * Sets if the entire filmstrip should be visible.
 *
 * @param {boolean} visible - Whether not the filmstrip is visible.
 * @returns {{
 *     type: SET_FILMSTRIP_VISIBILITY,
 *     visible: boolean
 * }}
 */
export function setFilmstripVisibility(visible) {
    return {
        type: SET_FILMSTRIP_VISIBILITY,
        visible
    };
}
