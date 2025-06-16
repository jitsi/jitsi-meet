import { IStore } from '../app/types';
import { getCurrentConference } from '../base/conference/functions';
import { getLocalParticipant } from '../base/participants/functions';
import { IParticipant } from '../base/participants/types';
import { LOBBY_CHAT_INITIALIZED } from '../lobby/constants';

import {
    ADD_MESSAGE,
    ADD_MESSAGE_REACTION,
    CLEAR_MESSAGES,
    CLOSE_CHAT,
    EDIT_MESSAGE,
    REMOVE_LOBBY_CHAT_PARTICIPANT,
    SEND_MESSAGE,
    SEND_REACTION,
    SET_IS_POLL_TAB_FOCUSED,
    SET_LOBBY_CHAT_ACTIVE_STATE,
    SET_LOBBY_CHAT_RECIPIENT,
    SET_PRIVATE_MESSAGE_RECIPIENT
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
 * Adds a reaction to a chat message.
 *
 * @param {Object} reactionDetails - The reaction to add.
 * @param {string} reactionDetails.participantId - The ID of the message to react to.
 * @param {string} reactionDetails.reactionList - The reaction to add.
 * @param {string} reactionDetails.messageId - The receiver ID of the reaction.
 * @returns {{
 *     type: ADD_MESSAGE_REACTION,
 *     participantId: string,
 *     reactionList: string[],
 *     messageId: string
 * }}
 */
export function addMessageReaction(reactionDetails: Object) {
    return {
        type: ADD_MESSAGE_REACTION,
        ...reactionDetails
    };
}

/**
 * Edits an existing chat message.
 *
 * @param {Object} message - The chat message to edit/override. The messages will be matched from the state
 * comparing the messageId.
 * @returns {{
 *     type: EDIT_MESSAGE,
 *     message: Object
 * }}
 */
export function editMessage(message: Object) {
    return {
        type: EDIT_MESSAGE,
        message
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
export function sendMessage(message: string, ignorePrivacy = false) {
    return {
        type: SEND_MESSAGE,
        ignorePrivacy,
        message
    };
}

/**
 * Sends a reaction to a message.
 *
 * @param {string} reaction - The reaction to send.
 * @param {string} messageId - The message ID to react to.
 * @param {string} receiverId - The receiver ID of the reaction.
 * @returns {Function}
 */
export function sendReaction(reaction: string, messageId: string, receiverId?: string) {

    return {
        type: SEND_REACTION,
        reaction,
        messageId,
        receiverId
    };
}

/**
 * Initiates the sending of a private message to the supplied participant.
 *
 * @param {IParticipant} participant - The participant to set the recipient to.
 * @returns {{
 *     participant: IParticipant,
 *     type: SET_PRIVATE_MESSAGE_RECIPIENT
 * }}
 */
export function setPrivateMessageRecipient(participant?: Object) {
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
 * @param {Object} lobbyChatInitializedInfo - The information about the attendee and the moderator
 * that is going to chat.
 *
 * @returns {Function}
 */
export function onLobbyChatInitialized(lobbyChatInitializedInfo: { attendee: IParticipant; moderator: IParticipant; }) {
    return async (dispatch: IStore['dispatch'], getState: IStore['getState']) => {
        const state = getState();
        const conference = getCurrentConference(state);

        const lobbyLocalId = conference?.myLobbyUserId();

        if (!lobbyLocalId) {
            return;
        }

        if (lobbyChatInitializedInfo.moderator.id === lobbyLocalId) {
            dispatch({
                type: SET_LOBBY_CHAT_RECIPIENT,
                participant: lobbyChatInitializedInfo.attendee,
                open: true
            });
        }

        if (lobbyChatInitializedInfo.attendee.id === lobbyLocalId) {
            return dispatch({
                type: SET_LOBBY_CHAT_RECIPIENT,
                participant: lobbyChatInitializedInfo.moderator,
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
export function setLobbyChatActiveState(value: boolean) {
    return {
        type: SET_LOBBY_CHAT_ACTIVE_STATE,
        payload: value
    };
}

/**
 * Removes lobby type messages.
 *
 *  @param {boolean} removeLobbyChatMessages - Should remove messages from chat  (works only for accepted users).
 * If not specified, it will delete all lobby messages.
 *
 * @returns {Object}
 */
export function removeLobbyChatParticipant(removeLobbyChatMessages?: boolean) {
    return {
        type: REMOVE_LOBBY_CHAT_PARTICIPANT,
        removeLobbyChatMessages
    };
}

/**
 * Handles initial setup of lobby message between
 * Moderator and participant.
 *
 * @param {string} participantId - The participant id.
 *
 * @returns {Object}
 */
export function handleLobbyChatInitialized(participantId: string) {
    return async (dispatch: IStore['dispatch'], getState: IStore['getState']) => {
        if (!participantId) {
            return;
        }
        const state = getState();
        const conference = state['features/base/conference'].conference;
        const { knockingParticipants } = state['features/lobby'];
        const { lobbyMessageRecipient } = state['features/chat'];
        const me = getLocalParticipant(state);
        const lobbyLocalId = conference?.myLobbyUserId();


        if (lobbyMessageRecipient && lobbyMessageRecipient.id === participantId) {
            return dispatch(setLobbyChatActiveState(true));
        }

        const attendee = knockingParticipants.find(p => p.id === participantId);

        if (attendee && attendee.chattingWithModerator === lobbyLocalId) {
            return dispatch({
                type: SET_LOBBY_CHAT_RECIPIENT,
                participant: attendee,
                open: true
            });
        }

        if (!attendee) {
            return;
        }

        const payload = { type: LOBBY_CHAT_INITIALIZED,
            moderator: {
                ...me,
                name: 'Moderator',
                id: lobbyLocalId
            },
            attendee };

        // notify attendee privately.
        conference?.sendLobbyMessage(payload, attendee.id);

        // notify other moderators.
        return conference?.sendLobbyMessage(payload);
    };
}
