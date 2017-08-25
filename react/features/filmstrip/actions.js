import {
    SET_FILMSTRIP_VISIBILITY
} from './actionTypes';

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
