// @flow

import { type Dispatch } from 'redux';

import { appNavigate, maybeRedirectToWelcomePage } from '../app';
import { conferenceLeft, conferenceWillJoin, getCurrentConference } from '../base/conference';
import { openDialog } from '../base/dialog';
import { getLocalParticipant } from '../base/participants';

import {
    KNOCKING_PARTICIPANT_ARRIVED_OR_UPDATED,
    KNOCKING_PARTICIPANT_LEFT,
    SET_KNOCKING_STATE,
    SET_LOBBY_MODE_ENABLED
} from './actionTypes';
import { DisableLobbyModeDialog, EnableLobbyModeDialog, LobbyScreen } from './components';

declare var APP: Object;

/**
 * Cancels the ongoing knocking and abandones the join flow.
 *
 * @returns {Function}
 */
export function cancelKnocking() {
    return async (dispatch: Dispatch<any>, getState: Function) => {
        if (typeof APP !== 'undefined') {
            // when we are redirecting the library should handle any
            // unload and clean of the connection.
            APP.API.notifyReadyToClose();
            dispatch(maybeRedirectToWelcomePage());

            return;
        }

        dispatch(conferenceLeft(getCurrentConference(getState)));
        dispatch(appNavigate(undefined));
    };
}

/**
 * Action to be dispatched when a knocking poarticipant leaves before any response.
 *
 * @param {string} id - The ID of the participant.
 * @returns {{
 *     id: string,
 *     type: KNOCKING_PARTICIPANT_LEFT
 * }}
 */
export function knockingParticipantLeft(id: string) {
    return {
        id,
        type: KNOCKING_PARTICIPANT_LEFT
    };
}

/**
 * Action to set the knocking state of the participant.
 *
 * @param {boolean} knocking - The new state.
 * @returns {{
 *     state: boolean,
 *     type: SET_KNOCKING_STATE
 * }}
 */
export function setKnockingState(knocking: boolean) {
    return {
        knocking,
        type: SET_KNOCKING_STATE
    };
}

/**
 * Starts knocking and waiting for approval.
 *
 * @param {string} password - The password to bypass knocking, if any.
 * @returns {Function}
 */
export function startKnocking(password?: string) {
    return async (dispatch: Dispatch<any>, getState: Function) => {
        const state = getState();
        const { membersOnly } = state['features/base/conference'];
        const localParticipant = getLocalParticipant(state);

        dispatch(setKnockingState(true));
        dispatch(conferenceWillJoin(membersOnly));
        membersOnly
            && membersOnly.joinLobby(localParticipant.name, localParticipant.email, password ? password : undefined);
    };
}

/**
 * Action to open the lobby screen.
 *
 * @returns {openDialog}
 */
export function openLobbyScreen() {
    return openDialog(LobbyScreen);
}

/**
 * Action to be executed when a participant starts knocking or an already knocking participant gets updated.
 *
 * @param {Object} participant - The knocking participant.
 * @returns {{
 *     participant: Object,
 *     type: KNOCKING_PARTICIPANT_ARRIVED_OR_UPDATED
 * }}
 */
export function participantIsKnockingOrUpdated(participant: Object) {
    return {
        participant,
        type: KNOCKING_PARTICIPANT_ARRIVED_OR_UPDATED
    };
}

/**
 * Approves (lets in) or rejects a knocking participant.
 *
 * @param {string} id - The id of the knocking participant.
 * @param {boolean} approved - True if the participant is approved, false otherwise.
 * @returns {Function}
 */
export function setKnockingParticipantApproval(id: string, approved: boolean) {
    return async (dispatch: Dispatch<any>, getState: Function) => {
        const { conference } = getState()['features/base/conference'];

        if (conference) {
            if (approved) {
                conference.lobbyApproveAccess(id);
            } else {
                conference.lobbyDenyAccess(id);
            }
        }
    };
}

/**
 * Action to set the new state of the lobby mode.
 *
 * @param {boolean} enabled - The new state to set.
 * @returns {{
 *     enabled: boolean,
 *     type: SET_LOBBY_MODE_ENABLED
 * }}
 */
export function setLobbyModeEnabled(enabled: boolean) {
    return {
        enabled,
        type: SET_LOBBY_MODE_ENABLED
    };
}

/**
 * Action to show the dialog to disable lobby mode.
 *
 * @returns {showNotification}
 */
export function showDisableLobbyModeDialog() {
    return openDialog(DisableLobbyModeDialog);
}

/**
 * Action to show the dialog to enable lobby mode.
 *
 * @returns {showNotification}
 */
export function showEnableLobbyModeDialog() {
    return openDialog(EnableLobbyModeDialog);
}

/**
 * Action to toggle lobby mode on or off.
 *
 * @param {boolean} enabled - The desired (new) state of the lobby mode.
 * @param {string} password - Optional password to be set.
 * @returns {Function}
 */
export function toggleLobbyMode(enabled: boolean, password?: string) {
    return async (dispatch: Dispatch<any>, getState: Function) => {
        const { conference } = getState()['features/base/conference'];

        if (enabled) {
            conference.enableLobby(password);
        } else {
            conference.disableLobby();
        }
    };
}
