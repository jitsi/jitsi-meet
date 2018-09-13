import {
    TOGGLE_CHAT,
    TOGGLE_SMILEY

} from './actionTypes';


/**
 * Toggles display of the chat side panel.
 *
 * @returns {{
 *     type: TOGGLE_CHAT
 * }}
 */
export function toggleChat() {
    return (dispatch, getState) => {
        dispatch({
            type: TOGGLE_CHAT,
            panelStatus: getState()['features/side-panel'].panelStatus
        });
    };

}

/**
 * Toggles display of the smiley panel.
 *
 * @returns {{
 *     type: TOGGLE_SMILEY
 * }}
 */
export function toggleSmiley() {
    return (dispatch, getState) => {
        dispatch({
            type: TOGGLE_SMILEY,
            smileyPanelStatus:
            getState()['features/side-panel'].smileyPanelStatus
        });

    };
}
