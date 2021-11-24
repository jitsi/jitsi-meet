// @flow
import { type Dispatch } from 'redux';

import { getCurrentConference } from '../base/conference';
import { getLocalParticipant } from '../base/participants';
import { CHALLENGE_RESPONSE_INITIALIZED } from '../lobby/constants';

import {
    ADD_MESSAGE,
    CLEAR_MESSAGES,
    CLOSE_CHAT,
    SEND_MESSAGE,
    SET_PRIVATE_MESSAGE_RECIPIENT,
    SET_IS_POLL_TAB_FOCUSED,
    SET_CHALLENGE_RESPONSE_RECIPIENT,
    REMOVE_CHALLENGE_RESPONSE_PARTICIPANT,
    SET_CHALLENGE_RESPONSE_ACTIVE_STATE
} from './actionTypes';

/**
 * Adds a chat message to the collection of messages.
 *
 * @param {Object} messageDetails - The chat message to save.
 * @param {string} messageDetails.displayName - The displayName of the
 * participant that authored the message.
 * @param {boolean} messageDetails.hasRead - Whether or not to immediately mark
 * the message as read.
 * @param {string} messageDetails.message - The received message to display.
 * @param {string} messageDetails.messageType - The kind of message, such as
 * "error" or "local" or "remote".
 * @param {string} messageDetails.timestamp - A timestamp to display for when
 * the message was received.
 * @param {string} messageDetails.isReaction - Whether or not the
 * message is a reaction message.
 * @returns {{
 *     type: ADD_MESSAGE,
 *     displayName: string,
 *     hasRead: boolean,
 *     message: string,
 *     messageType: string,
 *     timestamp: string,
 *     isReaction: boolean
 * }}
 */
export function addMessage(messageDetails: Object) {
    return {
        type: ADD_MESSAGE,
        ...messageDetails
    };
}

/**
 * Clears the chat messages in Redux.
 *
 * @returns {{
 *     type: CLEAR_MESSAGES
 * }}
 */
export function clearMessages() {
    return {
        type: CLEAR_MESSAGES
    };
}

/**
 * Action to signal the closing of the chat dialog.
 *
 * @returns {{
 *     type: CLOSE_CHAT
 * }}
 */
export function closeChat() {
    return {
        type: CLOSE_CHAT
    };
}

/**
 * Sends a chat message to everyone in the conference.
 *
 * @param {string} message - The chat message to send out.
 * @param {boolean} ignorePrivacy - True if the privacy notification should be ignored.
 * @returns {{
 *     type: SEND_MESSAGE,
 *     ignorePrivacy: boolean,
 *     message: string
 * }}
 */
export function sendMessage(message: string, ignorePrivacy: boolean = false) {
    return {
        type: SEND_MESSAGE,
        ignorePrivacy,
        message
    };
}

/**
 * Initiates the sending of a private message to the supplied participant.
 *
 * @param {Participant} participant - The participant to set the recipient to.
 * @returns {{
 *     participant: Participant,
 *     type: SET_PRIVATE_MESSAGE_RECIPIENT
 * }}
 */
export function setPrivateMessageRecipient(participant: Object) {
    return {
        participant,
        type: SET_PRIVATE_MESSAGE_RECIPIENT
    };
}

/**
 * Set the value of _isPollsTabFocused.
 *
 * @param {boolean} isPollsTabFocused - The new value for _isPollsTabFocused.
 * @returns {Function}
 */
export function setIsPollsTabFocused(isPollsTabFocused: boolean) {
    return {
        isPollsTabFocused,
        type: SET_IS_POLL_TAB_FOCUSED
    };
}

/**
 * Initiates the sending of messages between a moderator and a lobby attendee.
 *
 * @param {Object} challengeResponseInititializedInfo - The information about the attendee and the moderator
 * that is going to chat.
 *
 * @returns {Function}
 */
export function onChallengeResponseInitialized(challengeResponseInititializedInfo: Object) {
    return async (dispatch: Dispatch<any>, getState: Function) => {
        const state = getState();
        const conference = getCurrentConference(state);

        const lobbyLocalId = conference.getLobbyLocalId();

        if (!lobbyLocalId) {
            return;
        }

        if (challengeResponseInititializedInfo.moderator.id === lobbyLocalId) {
            dispatch({
                type: SET_CHALLENGE_RESPONSE_RECIPIENT,
                participant: challengeResponseInititializedInfo.attendee,
                open: true
            });
        }

        if (challengeResponseInititializedInfo.attendee.id === lobbyLocalId) {
            return dispatch({
                type: SET_CHALLENGE_RESPONSE_RECIPIENT,
                participant: challengeResponseInititializedInfo.moderator,
                open: false
            });
        }
    };
}

/**
 * Sets the lobby room's chat active state.
 *
 * @param {boolean} value - The active state.
 *
 * @returns {Object}
 */
export function setChallengeResponseActiveState(value: boolean) {
    return {
        type: SET_CHALLENGE_RESPONSE_ACTIVE_STATE,
        payload: value
    };
}

/** ...................
 * Removes lobby type messages.
 *
 *  @param {boolean} removeChallengeResponses - The participant to remove
 * If not specified, it will delete all lobby messages.
 *
 * @returns {Object}
 */
export function removeChallengeResponseParticipant(removeChallengeResponses: ?boolean) {
    return {
        type: REMOVE_CHALLENGE_RESPONSE_PARTICIPANT,
        removeChallengeResponses
    };
}

/** .........
 * Handles initial setup of lobby message between
 * Moderator and participant.
 *
 * @param {string} participantId - The participant id.
 *
 * @returns {Object}
 */
export function handleChallengeResponseInitialized(participantId: string) {
    return async (dispatch: Dispatch<any>, getState: Function) => {
        const state = getState();
        const conference = state['features/base/conference'].conference;
        const { knockingParticipants } = state['features/lobby'];
        const { challengeResponseRecipient } = state['features/chat'];
        const me = getLocalParticipant(state);
        const lobbyLocalId = conference.getLobbyLocalId();


        if (challengeResponseRecipient && challengeResponseRecipient.id === participantId) {
            return dispatch(setChallengeResponseActiveState(true));
        }

        const attendee = knockingParticipants.find(p => p.id === participantId);

        if (attendee && attendee.chattingWithModerator === lobbyLocalId) {
            return dispatch({
                type: SET_CHALLENGE_RESPONSE_RECIPIENT,
                participant: attendee,
                open: true
            });
        }

        if (!attendee) {
            return;
        }

        return conference.sendLobbyMessage({ type: CHALLENGE_RESPONSE_INITIALIZED,
            moderator: {
                ...me,
                id: lobbyLocalId
            },
            attendee });
    };
}
