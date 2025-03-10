import { ILocalParticipant, IParticipant } from '../base/participants/types';
import ReducerRegistry from '../base/redux/ReducerRegistry';

import {
    ADD_MESSAGE,
    ADD_MESSAGE_REACTION,
    CLEAR_MESSAGES,
    CLOSE_CHAT,
    EDIT_MESSAGE,
    OPEN_CHAT,
    REMOVE_LOBBY_CHAT_PARTICIPANT,
    SET_IS_POLL_TAB_FOCUSED,
    SET_LOBBY_CHAT_ACTIVE_STATE,
    SET_LOBBY_CHAT_RECIPIENT,
    SET_PRIVATE_MESSAGE_RECIPIENT
} from './actionTypes';
import { IMessage } from './types';

const DEFAULT_STATE = {
    isOpen: false,
    isPollsTabFocused: false,
    lastReadMessage: undefined,
    messages: [],
    reactions: {},
    nbUnreadMessages: 0,
    privateMessageRecipient: undefined,
    lobbyMessageRecipient: undefined,
    isLobbyChatActive: false
};

export interface IChatState {
    isLobbyChatActive: boolean;
    isOpen: boolean;
    isPollsTabFocused: boolean;
    lastReadMessage?: IMessage;
    lobbyMessageRecipient?: {
        id: string;
        name: string;
    } | ILocalParticipant;
    messages: IMessage[];
    nbUnreadMessages: number;
    privateMessageRecipient?: IParticipant;
}

ReducerRegistry.register<IChatState>('features/chat', (state = DEFAULT_STATE, action): IChatState => {
    switch (action.type) {
    case ADD_MESSAGE: {
        const newMessage: IMessage = {
            displayName: action.displayName,
            error: action.error,
            participantId: action.participantId,
            isReaction: action.isReaction,
            messageId: action.messageId,
            messageType: action.messageType,
            message: action.message,
            reactions: action.reactions,
            privateMessage: action.privateMessage,
            lobbyChat: action.lobbyChat,
            recipient: action.recipient,
            timestamp: action.timestamp
        };

        // React native, unlike web, needs a reverse sorted message list.
        const messages = navigator.product === 'ReactNative'
            ? [
                newMessage,
                ...state.messages
            ]
            : [
                ...state.messages,
                newMessage
            ];

        return {
            ...state,
            lastReadMessage:
                action.hasRead ? newMessage : state.lastReadMessage,
            nbUnreadMessages: state.isPollsTabFocused ? state.nbUnreadMessages + 1 : state.nbUnreadMessages,
            messages
        };
    }

    case ADD_MESSAGE_REACTION: {
        const { participantId, reactionList, messageId } = action;

        // Create a new state with deep copy of messages
        const newState = {
            ...state,
            messages: state.messages.map(message => {

                // Only modify the message that matches the messageId
                if (message.messageId === messageId) {
 
                    // Create a new reactions map from the existing one
                    const newReactions = new Map(message.reactions);
 
                    // First, remove the participant from all existing reaction sets

                    newReactions.forEach((participants, reaction) => {

                        // Create a new Set without the current participant
                        const newParticipants = new Set([ ...participants ].filter(id => id !== participantId));

                        // If there are still participants with this reaction, update the map
                        if (newParticipants.size > 0) {

                            newReactions.set(reaction, newParticipants);
                        } else { // Otherwise, remove the reaction from the map

                            newReactions.delete(reaction);
                        }
                    });

                    // Add the participant to their chosen reaction(s)
                    reactionList.forEach((reaction: string) => {
                        const existingParticipants = newReactions.get(reaction) || new Set();
                        const updatedParticipants = new Set([ ...existingParticipants, participantId ]);

                        newReactions.set(reaction, updatedParticipants);
                    });

                    // Return updated message with new reactions Map
                    return {
                        ...message,
                        reactions: newReactions
                    };
                }

                // Return unchanged message for other messages
                return message;
            })
        };

        return newState;
    }

    case CLEAR_MESSAGES:
        return {
            ...state,
            lastReadMessage: undefined,
            messages: []
        };

    case EDIT_MESSAGE: {
        let found = false;
        const newMessage = action.message;
        const messages = state.messages.map(m => {
            if (m.messageId === newMessage.messageId) {
                found = true;

                return newMessage;
            }

            return m;
        });

        // no change
        if (!found) {
            return state;
        }

        return {
            ...state,
            messages
        };
    }

    case SET_PRIVATE_MESSAGE_RECIPIENT:
        return {
            ...state,
            privateMessageRecipient: action.participant
        };

    case OPEN_CHAT:
        return {
            ...state,
            isOpen: true,
            privateMessageRecipient: action.participant
        };

    case CLOSE_CHAT:
        return {
            ...state,
            isOpen: false,
            lastReadMessage: state.messages[
                navigator.product === 'ReactNative' ? 0 : state.messages.length - 1],
            privateMessageRecipient: action.participant,
            isLobbyChatActive: false
        };

    case SET_IS_POLL_TAB_FOCUSED: {
        return {
            ...state,
            isPollsTabFocused: action.isPollsTabFocused,
            nbUnreadMessages: 0
        }; }

    case SET_LOBBY_CHAT_RECIPIENT:
        return {
            ...state,
            isLobbyChatActive: true,
            lobbyMessageRecipient: action.participant,
            privateMessageRecipient: undefined,
            isOpen: action.open
        };
    case SET_LOBBY_CHAT_ACTIVE_STATE:
        return {
            ...state,
            isLobbyChatActive: action.payload,
            isOpen: action.payload || state.isOpen,
            privateMessageRecipient: undefined
        };
    case REMOVE_LOBBY_CHAT_PARTICIPANT:
        return {
            ...state,
            messages: state.messages.filter(m => {
                if (action.removeLobbyChatMessages) {
                    return !m.lobbyChat;
                }

                return true;
            }),
            isOpen: state.isOpen && state.isLobbyChatActive ? false : state.isOpen,
            isLobbyChatActive: false,
            lobbyMessageRecipient: undefined
        };
    }

    return state;
});
