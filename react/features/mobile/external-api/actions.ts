import {
    CUSTOM_OVERFLOW_MENU_BUTTON_PRESSED,
    READY_TO_CLOSE,
    SCREEN_SHARE_PARTICIPANTS_UPDATED
} from './actionTypes';


/**
 * Creates a (redux) action which signals that the SDK is ready to be closed.
 *
 * @returns {{
 *     type: READY_TO_CLOSE
 * }}
 */
export function readyToClose() {
    return {
        type: READY_TO_CLOSE
    };
}

/**
 * Creates a (redux) action which signals that the list of known participants
 * with screen shares has changed.
 *
 * @param {string} participantIds - The participants which currently have active
 * screen share streams.
 * @returns {{
 *     type: SCREEN_SHARE_PARTICIPANTS_UPDATED,
 *     participantId: string
 * }}
 */
export function setParticipantsWithScreenShare(participantIds: Array<string>) {
    return {
        type: SCREEN_SHARE_PARTICIPANTS_UPDATED,
        participantIds
    };
}

/**
 * Creates a (redux) action which that a custom overflow menu button was pressed.
 *
 * @param {string} id - The id for the custom button.
 * @param {string} text - The label for the custom button.
 * @returns {{
 *     type: CUSTOM_OVERFLOW_MENU_BUTTON_PRESSED,
 *     id: string,
 *     text: string
 * }}
 */
export function customOverflowMenuButtonPressed(id: string, text: string) {
    return {
        type: CUSTOM_OVERFLOW_MENU_BUTTON_PRESSED,
        id,
        text
    };
}
