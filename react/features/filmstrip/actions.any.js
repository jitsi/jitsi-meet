// @flow

import { SET_FILMSTRIP_ENABLED, SET_FILMSTRIP_VISIBLE, SET_REMOTE_PARTICIPANTS } from './actionTypes';

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
