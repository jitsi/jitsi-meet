/* eslint-disable lines-around-comment */
import { IStore } from '../app/types';
import { openSheet } from '../base/dialog/actions';
import { navigate }
    from '../mobile/navigation/components/conference/ConferenceNavigationContainerRef';
import { screen } from '../mobile/navigation/routes';
import ConnectionStatusComponent
    from '../video-menu/components/native/ConnectionStatusComponent';
// @ts-ignore
import LocalVideoMenu from '../video-menu/components/native/LocalVideoMenu';
// @ts-ignore
import RemoteVideoMenu from '../video-menu/components/native/RemoteVideoMenu';
// @ts-ignore
import SharedVideoMenu from '../video-menu/components/native/SharedVideoMenu';

import { PARTICIPANTS_PANE_OPEN, SET_VOLUME } from './actionTypes';
import RoomParticipantMenu from './components/native/RoomParticipantMenu';

export * from './actions.any';

/**
 * Displays the connection status for the local meeting participant.
 *
 * @param {string} participantID - The selected meeting participant id.
 * @returns {Function}
 */
export function showConnectionStatus(participantID: string) {
    return openSheet(ConnectionStatusComponent, { participantID });
}

/**
 * Displays the context menu for the selected meeting participant.
 *
 * @param {string} participantId - The ID of the selected meeting participant.
 * @param {boolean} local - Whether the participant is local or not.
 * @returns {Function}
 */
export function showContextMenuDetails(participantId: string, local = false) {
    return (dispatch: IStore['dispatch'], getState: IStore['getState']) => {
        const { remoteVideoMenu } = getState()['features/base/config'];

        if (local) {
            dispatch(openSheet(LocalVideoMenu));
        } else if (!remoteVideoMenu?.disabled) {
            dispatch(openSheet(RemoteVideoMenu, { participantId }));
        }
    };
}

/**
 * Displays the shared video menu.
 *
 * @param {string} participantId - The ID of the selected meeting participant.
 * @returns {Function}
 */
export function showSharedVideoMenu(participantId: string) {
    return openSheet(SharedVideoMenu, { participantId });
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

/**
 * Displays the breakout room participant menu.
 *
 * @param {Object} room - The room the participant is in.
 * @param {string} participantJid - The jid of the participant.
 * @param {string} participantName - The display name of the participant.
 * @returns {Function}
 */
export function showRoomParticipantMenu(room: Object, participantJid: string, participantName: string) {
    // @ts-ignore
    return openSheet(RoomParticipantMenu, { room,
        participantJid,
        participantName });
}

/**
 * Action to open the participants pane.
 *
 * @returns {Object}
 */
export const open = () => {
    navigate(screen.conference.participants);

    return {
        type: PARTICIPANTS_PANE_OPEN
    };
};
