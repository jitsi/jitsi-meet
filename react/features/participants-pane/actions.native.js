// @flow

import { openDialog } from '../base/dialog';
import { SharedVideoMenu } from '../video-menu';
import { LocalVideoMenu } from '../video-menu/components/native';
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
export function showConnectionStatus(participantID: string) {
    return openDialog(ConnectionStatusComponent, { participantID });
}

/**
 * Displays the context menu for the selected meeting participant.
 *
 * @param {string} participantId - The ID of the selected meeting participant.
 * @param {boolean} local - Whether the participant is local or not.
 * @returns {Function}
 */
export function showContextMenuDetails(participantId: string, local: boolean = false) {
    return local
        ? openDialog(LocalVideoMenu)
        : openDialog(RemoteVideoMenu, { participantId });
}

/**
 * Displays the shared video menu.
 *
 * @param {string} participantId - The ID of the selected meeting participant.
 * @returns {Function}
 */
export function showSharedVideoMenu(participantId: string) {
    return openDialog(SharedVideoMenu, { participantId });
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
