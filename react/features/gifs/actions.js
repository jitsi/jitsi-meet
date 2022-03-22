import {
    ADD_GIF_FOR_PARTICIPANT,
    HIDE_GIF_FOR_PARTICIPANT,
    REMOVE_GIF_FOR_PARTICIPANT,
    SET_GIF_DRAWER_VISIBILITY,
    SET_GIF_MENU_VISIBILITY,
    SHOW_GIF_FOR_PARTICIPANT
} from './actionTypes';

/**
 * Adds a GIF for a given participant.
 *
 * @param {string} participantId - The id of the participant that sent the GIF.
 * @param {string} gifUrl - The URL of the GIF.
 * @returns {Object}
 */
export function addGif(participantId, gifUrl) {
    return {
        type: ADD_GIF_FOR_PARTICIPANT,
        participantId,
        gifUrl
    };
}

/**
 * Removes the GIF of the given participant.
 *
 * @param {string} participantId - The Id of the participant for whom to remove the GIF.
 * @returns {Object}
 */
export function removeGif(participantId) {
    return {
        type: REMOVE_GIF_FOR_PARTICIPANT,
        participantId
    };
}

/**
 * Keep showing the GIF of the given participant.
 *
 * @param {string} participantId - The Id of the participant for whom to show the GIF.
 * @returns {Object}
 */
export function showGif(participantId) {
    return {
        type: SHOW_GIF_FOR_PARTICIPANT,
        participantId
    };
}

/**
 * Set timeout to hide the GIF of the given participant.
 *
 * @param {string} participantId - The Id of the participant for whom to show the GIF.
 * @returns {Object}
 */
export function hideGif(participantId) {
    return {
        type: HIDE_GIF_FOR_PARTICIPANT,
        participantId
    };
}

/**
 * Set visibility of the GIF drawer.
 *
 * @param {boolean} visible - Whether or not it should be visible.
 * @returns {Object}
 */
export function setGifDrawerVisibility(visible) {
    return {
        type: SET_GIF_DRAWER_VISIBILITY,
        visible
    };
}

/**
 * Set visibility of the GIF menu.
 *
 * @param {boolean} visible - Whether or not it should be visible.
 * @returns {Object}
 */
export function setGifMenuVisibility(visible) {
    return {
        type: SET_GIF_MENU_VISIBILITY,
        visible
    };
}
