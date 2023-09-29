import { IStore } from '../app/types';
import { conferenceWillJoin, setPassword } from '../base/conference/actions';
import { getCurrentConference, sendLocalParticipant } from '../base/conference/functions';
import { getLocalParticipant } from '../base/participants/functions';
import { IParticipant } from '../base/participants/types';
import { onLobbyChatInitialized, removeLobbyChatParticipant, sendMessage } from '../chat/actions.any';
import { LOBBY_CHAT_MESSAGE } from '../chat/constants';
import { handleLobbyMessageReceived } from '../chat/middleware';
import { hideNotification, showNotification } from '../notifications/actions';
import { LOBBY_NOTIFICATION_ID } from '../notifications/constants';
import { joinConference } from '../prejoin/actions';

import {
    KNOCKING_PARTICIPANT_ARRIVED_OR_UPDATED,
    KNOCKING_PARTICIPANT_LEFT,
    REMOVE_LOBBY_CHAT_WITH_MODERATOR,
    SET_KNOCKING_STATE,
    SET_LOBBY_MODE_ENABLED,
    SET_LOBBY_PARTICIPANT_CHAT_STATE,
    SET_LOBBY_VISIBILITY,
    SET_PASSWORD_JOIN_FAILED
} from './actionTypes';
import { LOBBY_CHAT_INITIALIZED, MODERATOR_IN_CHAT_WITH_LEFT } from './constants';
import { getKnockingParticipants, getLobbyConfig, getLobbyEnabled } from './functions';
import { IKnockingParticipant } from './types';

/**
 * Tries to join with a preset password.
 *
 * @param {string} password - The password to join with.
 * @returns {Function}
 */
export function joinWithPassword(password: string) {
    return async (dispatch: IStore['dispatch'], getState: IStore['getState']) => {
        const conference = getCurrentConference(getState);

        dispatch(setPassword(conference, conference?.join, password));
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
 * Action to be executed when a participant starts knocking or an already knocking participant gets updated.
 *
 * @param {Object} participant - The knocking participant.
 * @returns {{
 *     participant: Object,
 *     type: KNOCKING_PARTICIPANT_ARRIVED_OR_UPDATED
 * }}
 */
export function participantIsKnockingOrUpdated(participant: IKnockingParticipant | Object) {
    return {
        participant,
        type: KNOCKING_PARTICIPANT_ARRIVED_OR_UPDATED
    };
}

/**
 * Handles a knocking participant and dismisses the notification.
 *
 * @param {string} id - The id of the knocking participant.
 * @param {boolean} approved - True if the participant is approved, false otherwise.
 * @returns {Function}
 */
export function answerKnockingParticipant(id: string, approved: boolean) {
    return async (dispatch: IStore['dispatch']) => {
        dispatch(setKnockingParticipantApproval(id, approved));
        dispatch(hideNotification(LOBBY_NOTIFICATION_ID));
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
    return async (dispatch: IStore['dispatch'], getState: IStore['getState']) => {
        const conference = getCurrentConference(getState);

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
 * Action used to admit multiple participants in the conference.
 *
 * @param {Array<Object>} participants - A list of knocking participants.
 * @returns {void}
 */
export function admitMultiple(participants: Array<IKnockingParticipant>) {
    return (dispatch: IStore['dispatch'], getState: IStore['getState']) => {
        const conference = getCurrentConference(getState);

        participants.forEach(p => {
            conference?.lobbyApproveAccess(p.id);
        });
    };
}

/**
 * Approves the request of a knocking participant to join the meeting.
 *
 * @param {string} id - The id of the knocking participant.
 * @returns {Function}
 */
export function approveKnockingParticipant(id: string) {
    return (dispatch: IStore['dispatch'], getState: IStore['getState']) => {
        const conference = getCurrentConference(getState);

        conference?.lobbyApproveAccess(id);
    };
}

/**
 * Denies the request of a knocking participant to join the meeting.
 *
 * @param {string} id - The id of the knocking participant.
 * @returns {Function}
 */
export function rejectKnockingParticipant(id: string) {
    return (dispatch: IStore['dispatch'], getState: IStore['getState']) => {
        const conference = getCurrentConference(getState);

        conference?.lobbyDenyAccess(id);
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
 * Action to be dispatched when we failed to join with a password.
 *
 * @param {boolean} failed - True of recent password join failed.
 * @returns {{
 *     failed: boolean,
 *     type: SET_PASSWORD_JOIN_FAILED
 * }}
 */
export function setPasswordJoinFailed(failed: boolean) {
    return {
        failed,
        type: SET_PASSWORD_JOIN_FAILED
    };
}

/**
 * Starts knocking and waiting for approval.
 *
 * @returns {Function}
 */
export function startKnocking() {
    return async (dispatch: IStore['dispatch'], getState: IStore['getState']) => {
        const state = getState();
        const { membersOnly } = state['features/base/conference'];

        if (!membersOnly) {

            // no membersOnly, this means we got lobby screen shown as someone
            // tried to join a conference that has lobby enabled without setting display name
            // join conference should trigger the lobby/member_only path after setting the display name
            // this is possible only for web, where we can join without a prejoin screen
            dispatch(joinConference());

            return;
        }

        const localParticipant = getLocalParticipant(state);

        dispatch(conferenceWillJoin(membersOnly));

        // We need to update the conference object with the current display name, if approved
        // we want to send that display name, it was not updated in case when pre-join is disabled
        sendLocalParticipant(state, membersOnly);

        membersOnly?.joinLobby(localParticipant?.name, localParticipant?.email);
        dispatch(setLobbyMessageListener());
        dispatch(setKnockingState(true));
    };
}

/**
 * Action to toggle lobby mode on or off.
 *
 * @param {boolean} enabled - The desired (new) state of the lobby mode.
 * @returns {Function}
 */
export function toggleLobbyMode(enabled: boolean) {
    return async (dispatch: IStore['dispatch'], getState: IStore['getState']) => {
        const conference = getCurrentConference(getState);

        if (enabled) {
            conference?.enableLobby();
        } else {
            conference?.disableLobby();
        }
    };
}

/**
 * Action to open the lobby screen.
 *
 * @returns {openDialog}
 */
export function openLobbyScreen() {
    return {
        type: SET_LOBBY_VISIBILITY,
        visible: true
    };
}

/**
 * Action to hide the lobby screen.
 *
 * @returns {hideDialog}
 */
export function hideLobbyScreen() {
    return {
        type: SET_LOBBY_VISIBILITY,
        visible: false
    };
}

/**
 * Action to handle chat initialized in the lobby room.
 *
 * @param {Object} payload - The payload received,
 * contains the information about the two participants
 * that will chat with each other in the lobby room.
 *
 * @returns {Promise<void>}
 */
export function handleLobbyChatInitialized(payload: { attendee: IParticipant; moderator: IParticipant; }) {
    return async (dispatch: IStore['dispatch'], getState: IStore['getState']) => {
        const state = getState();
        const conference = getCurrentConference(state);

        const id = conference?.myLobbyUserId();

        dispatch({
            type: SET_LOBBY_PARTICIPANT_CHAT_STATE,
            participant: payload.attendee,
            moderator: payload.moderator
        });

        dispatch(onLobbyChatInitialized(payload));

        const attendeeIsKnocking = getKnockingParticipants(state).some(p => p.id === payload.attendee.id);

        if (attendeeIsKnocking && conference?.getRole() === 'moderator' && payload.moderator.id !== id) {
            dispatch(showNotification({
                titleKey: 'lobby.lobbyChatStartedNotification',
                titleArguments: {
                    moderator: payload.moderator.name ?? '',
                    attendee: payload.attendee.name ?? ''
                }
            }));
        }
    };
}

/**
 * Action to send message to the moderator.
 *
 * @param {string} message - The message to be sent.
 *
 * @returns {Promise<void>}
 */
export function onSendMessage(message: string) {
    return async (dispatch: IStore['dispatch']) => {
        dispatch(sendMessage(message));
    };
}

/**
 * Action to send lobby message to every participant. Only allowed for moderators.
 *
 * @param {Object} message - The message to be sent.
 *
 * @returns {Promise<void>}
 */
export function sendLobbyChatMessage(message: Object) {
    return async (dispatch: IStore['dispatch'], getState: IStore['getState']) => {
        const conference = getCurrentConference(getState);

        conference?.sendLobbyMessage(message);
    };
}

/**
 * Sets lobby listeners if lobby has been enabled.
 *
 * @returns {Function}
 */
export function maybeSetLobbyChatMessageListener() {
    return async (dispatch: IStore['dispatch'], getState: IStore['getState']) => {
        const state = getState();
        const lobbyEnabled = getLobbyEnabled(state);

        if (lobbyEnabled) {
            dispatch(setLobbyMessageListener());
        }
    };
}

/**
 * Action to handle the event when a moderator leaves during lobby chat.
 *
 * @param {string} participantId - The participant id of the moderator who left.
 * @returns {Function}
 */
export function updateLobbyParticipantOnLeave(participantId: string) {
    return async (dispatch: IStore['dispatch'], getState: IStore['getState']) => {
        const state = getState();
        const { knocking, knockingParticipants } = state['features/lobby'];
        const { lobbyMessageRecipient } = state['features/chat'];
        const { conference } = state['features/base/conference'];

        if (knocking && lobbyMessageRecipient && lobbyMessageRecipient.id === participantId) {
            return dispatch(removeLobbyChatParticipant(true));
        }

        if (!knocking) {
            // inform knocking participant when their moderator leaves
            const participantToNotify = knockingParticipants.find(p => p.chattingWithModerator === participantId);

            if (participantToNotify) {
                conference?.sendLobbyMessage({
                    type: MODERATOR_IN_CHAT_WITH_LEFT,
                    moderatorId: participantToNotify.chattingWithModerator
                }, participantToNotify.id);
            }
            dispatch({
                type: REMOVE_LOBBY_CHAT_WITH_MODERATOR,
                moderatorId: participantId
            });
        }
    };
}

/**
 * Handles all messages received in the lobby room.
 *
 * @returns {Function}
 */
export function setLobbyMessageListener() {
    return async (dispatch: IStore['dispatch'], getState: IStore['getState']) => {
        const state = getState();
        const conference = getCurrentConference(state);
        const { enableChat = true } = getLobbyConfig(state);

        if (!enableChat) {
            return;
        }

        conference?.addLobbyMessageListener((message: any, participantId: string) => {
            if (message.type === LOBBY_CHAT_MESSAGE) {
                return dispatch(handleLobbyMessageReceived(message.message, participantId));
            }
            if (message.type === LOBBY_CHAT_INITIALIZED) {
                return dispatch(handleLobbyChatInitialized(message));
            }
            if (message.type === MODERATOR_IN_CHAT_WITH_LEFT) {
                return dispatch(updateLobbyParticipantOnLeave(message.moderatorId));
            }
        });
    };
}

