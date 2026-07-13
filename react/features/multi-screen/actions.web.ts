import {
    REMOVE_SECOND_SCREEN,
    RESET_SECOND_SCREENS,
    SET_SECOND_SCREEN,
    SET_SECOND_SCREEN_WINDOW
} from './actionTypes';
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
 * Attaches the live window handle to a second-screen entry once the middleware
 * has opened the window. The handle is typed opaquely ({@code unknown}) because
 * it holds DOM/media objects the shared/native build cannot type; see
 * {@code functions.web.ts}.
 *
 * @param {string} id - The window identifier.
 * @param {unknown} handle - The live window handle.
 * @returns {{ type: SET_SECOND_SCREEN_WINDOW, id: string, handle: unknown }}
 */
export function setSecondScreenWindow(id: string, handle: unknown) {
    return {
        type: SET_SECOND_SCREEN_WINDOW,
        id,
        handle
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
