// @flow

import { openDialog } from '../base/dialog';
import { SharedVideoMenu } from '../video-menu';
import ConnectionStatusComponent
    from '../video-menu/components/native/ConnectionStatusComponent';
import RemoteVideoMenu from '../video-menu/components/native/RemoteVideoMenu';

import { SET_VOLUME } from './actionTypes';
import {
    ContextMenuLobbyParticipantReject
} from './components/native';
export * from './actions.any';

/**
 * Displays the context menu for the selected lobby participant.
 *
 * @param {Object} participant - The selected lobby participant.
 * @returns {Function}
 */
export function showContextMenuReject(participant: Object) {
    return openDialog(ContextMenuLobbyParticipantReject, { participant });
}


/**
 * Displays the connection status for the local meeting participant.
 *
 * @param {string} participantID - The selected meeting participant id.
 * @returns {Function}
 */
export function showConnectionStatus(participantID: String) {
    return openDialog(ConnectionStatusComponent, { participantID });
}

/**
 * Displays the context menu for the selected meeting participant.
 *
 * @param {Object} participant - The selected meeting participant.
 * @returns {Function}
 */
export function showContextMenuDetails(participant: Object) {
    return openDialog(RemoteVideoMenu, { participant });
}

/**
 * Displays the shared video menu.
 *
 * @param {Object} participant - The selected meeting participant.
 * @returns {Function}
 */
export function showSharedVideoMenu(participant: Object) {
    return openDialog(SharedVideoMenu, { participant });
}

/**
 * Sets the volume.
 *
 * @param {string} participantId - The participant ID associated with the audio.
 * @param {string} volume - The volume level.
 * @returns {{
 *     type: SET_VOLUME,
 *     participantId: string,
 *     volume: number
 * }}
 */
export function setVolume(participantId: string, volume: number) {
    return {
        type: SET_VOLUME,
        participantId,
        volume
    };
}
