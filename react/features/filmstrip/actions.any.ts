import {
    SET_FILMSTRIP_ENABLED,
    SET_FILMSTRIP_VISIBLE,
    SET_REMOTE_PARTICIPANTS,
    SET_VISIBLE_REMOTE_PARTICIPANTS
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

/**
 * Sets the list of the reordered remote participants based on which the visible participants in the filmstrip will be
 * determined.
 *
 * @param {Array<string>} participants - The list of the remote participant endpoint IDs.
 * @returns {{
        type: SET_REMOTE_PARTICIPANTS,
        participants: Array<string>
    }}
 */
export function setRemoteParticipants(participants: Array<string>) {
    return {
        type: SET_REMOTE_PARTICIPANTS,
        participants
    };
}

/**
 * Sets the list of the visible participants in the filmstrip by storing the start and end index from the remote
 * participants array.
 *
 * @param {number} startIndex - The start index from the remote participants array.
 * @param {number} endIndex - The end index from the remote participants array.
 * @returns {{
 *      type: SET_VISIBLE_REMOTE_PARTICIPANTS,
 *      startIndex: number,
 *      endIndex: number
 * }}
 */
export function setVisibleRemoteParticipants(startIndex: number, endIndex: number) {
    return {
        type: SET_VISIBLE_REMOTE_PARTICIPANTS,
        startIndex,
        endIndex
    };
}
