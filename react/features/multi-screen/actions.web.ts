import { REMOVE_SECOND_SCREEN, RESET_SECOND_SCREENS, SET_SECOND_SCREEN } from './actionTypes';
import { ISecondScreenSource } from './types';

/**
 * Opens or updates the second-screen window identified by {@code id} to render
 * the given source. Passing an empty/invalid source closes that window instead.
 *
 * @param {string} id - The window identifier (allows more than one second screen).
 * @param {ISecondScreenSource} source - What to render.
 * @param {number} screenId - Optional physical screen index to place the window on.
 * @returns {Object}
 */
export function setSecondScreen(id: string, source?: ISecondScreenSource, screenId?: number) {
    if (!source || (!source.role && !source.participant)) {
        return { type: REMOVE_SECOND_SCREEN, id };
    }

    return {
        type: SET_SECOND_SCREEN,
        id,
        source,
        screenId
    };
}

/**
 * Closes a single second-screen window.
 *
 * @param {string} id - The window identifier.
 * @returns {{ type: REMOVE_SECOND_SCREEN, id: string }}
 */
export function removeSecondScreen(id: string) {
    return {
        type: REMOVE_SECOND_SCREEN,
        id
    };
}

/**
 * Closes all second-screen windows.
 *
 * @returns {{ type: RESET_SECOND_SCREENS }}
 */
export function resetSecondScreens() {
    return {
        type: RESET_SECOND_SCREENS
    };
}
