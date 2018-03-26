import {
    CLOSE_PANEL,
    SET_VISIBLE_PANEL,
    TOGGLE_CHAT,
    TOGGLE_PROFILE,
    TOGGLE_SETTINGS
} from './actionTypes';

/**
 * Dispatches an action to close the currently displayed side panel.
 *
 * @returns {Function}
 */
export function closePanel() {
    return (dispatch, getState) => {
        dispatch({
            type: CLOSE_PANEL,
            current: getState()['features/side-panel'].current
        });
    };
}

/**
 * Updates the redux store with the currently displayed side panel.
 *
 * @param {string|null} name - The name of the side panel being displayed. Null
 * (or falsy) should be set if no side panel is being displayed.
 * @returns {{
 *     type: SET_VISIBLE_PANEL,
 *     current: string
 * }}
 */
export function setVisiblePanel(name = null) {
    return {
        type: SET_VISIBLE_PANEL,
        current: name
    };
}

/**
 * Toggles display of the chat side panel.
 *
 * @returns {{
 *     type: TOGGLE_CHAT
 * }}
 */
export function toggleChat() {
    return {
        type: TOGGLE_CHAT
    };
}

/**
 * Toggles display of the profile side panel.
 *
 * @returns {{
 *     type: TOGGLE_PROFILE
 * }}
 */
export function toggleProfile() {
    return {
        type: TOGGLE_PROFILE
    };
}

/**
 * Toggles display of the settings side panel.
 *
 * @returns {{
 *     type: TOGGLE_SETTINGS
 * }}
 */
export function toggleSettings() {
    return {
        type: TOGGLE_SETTINGS
    };
}
