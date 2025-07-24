import { UPDATE_CONFERENCE_METADATA } from '../base/conference/actionTypes';
import { ILocalParticipant, IParticipant } from '../base/participants/types';
import ReducerRegistry from '../base/redux/ReducerRegistry';
import { IVisitorChatParticipant } from '../visitors/types';

import {
    ADD_MESSAGE,
    ADD_MESSAGE_REACTION,
    CLEAR_MESSAGES,
    CLOSE_CHAT,
    EDIT_MESSAGE,
    OPEN_CHAT,
    REMOVE_LOBBY_CHAT_PARTICIPANT,
    SET_CHAT_IS_RESIZING,
    SET_CHAT_WIDTH,
    SET_FOCUSED_TAB,
    SET_LOBBY_CHAT_ACTIVE_STATE,
    SET_LOBBY_CHAT_RECIPIENT,
    SET_PRIVATE_MESSAGE_RECIPIENT,
    SET_USER_CHAT_WIDTH
} from './actionTypes';
import { CHAT_SIZE, ChatTabs } from './constants';
import { IMessage } from './types';

const DEFAULT_STATE = {
    groupChatWithPermissions: false,
    isOpen: false,
    messages: [],
    reactions: {},
    nbUnreadMessages: 0,
    privateMessageRecipient: undefined,
    lobbyMessageRecipient: undefined,
    isLobbyChatActive: false,
    focusedTab: ChatTabs.CHAT,
    isResizing: false,
    width: {
        current: CHAT_SIZE,
        userSet: null
    }
};

export interface IChatState {
    focusedTab: ChatTabs;
    groupChatWithPermissions: boolean;
    isLobbyChatActive: boolean;
    isOpen: boolean;
    isResizing: boolean;
    lastReadMessage?: IMessage;
    lobbyMessageRecipient?: {
        id: string;
        name: string;
    } | ILocalParticipant;
    messages: IMessage[];
    nbUnreadMessages: number;
    privateMessageRecipient?: IParticipant | IVisitorChatParticipant;
    width: {
        current: number;
        userSet: number | null;
    };
}

ReducerRegistry.register<IChatState>('features/chat', (state = DEFAULT_STATE, action): IChatState => {
    switch (action.type) {
    case ADD_MESSAGE: {
        const newMessage: IMessage = {
            displayName: action.displayName,
            error: action.error,
            isFromVisitor: Boolean(action.isFromVisitor),
            participantId: action.participantId,
            isReaction: action.isReaction,
            messageId: action.messageId,
            messageType: action.messageType,
            message: action.message,
            reactions: action.reactions,
            privateMessage: action.privateMessage,
            lobbyChat: action.lobbyChat,
            recipient: action.recipient,
            sentToVisitor: Boolean(action.sentToVisitor),
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
            nbUnreadMessages: state.focusedTab !== ChatTabs.CHAT ? state.nbUnreadMessages + 1 : state.nbUnreadMessages,
            messages
        };
    }

    case ADD_MESSAGE_REACTION: {
        const { participantId, reactionList, messageId } = action;

        const messages = state.messages.map(message => {
            if (messageId === message.messageId) {
                const newReactions = new Map(message.reactions);

                reactionList.forEach((reaction: string) => {
                    let participants = newReactions.get(reaction);

                    if (!participants) {
                        participants = new Set();
                        newReactions.set(reaction, participants);
                    }

                    participants.add(participantId);
                });

                return {
                    ...message,
                    reactions: newReactions
                };
            }

            return message;
        });

        return {
            ...state,
            messages
        };
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
    case UPDATE_CONFERENCE_METADATA: {
        const { metadata } = action;

        if (metadata?.permissions) {
            return {
                ...state,
                groupChatWithPermissions: Boolean(metadata.permissions.groupChatRestricted)
            };
        }

        break;
    }
    case SET_FOCUSED_TAB:
        return {
            ...state,
            focusedTab: action.tabId,
            nbUnreadMessages: action.tabId === ChatTabs.CHAT ? 0 : state.nbUnreadMessages
        };

    case SET_CHAT_WIDTH: {
        return {
            ...state,
            width: {
                ...state.width,
                current: action.width
            }
        };
    }

    case SET_USER_CHAT_WIDTH: {
        const { width } = action;

        return {
            ...state,
            width: {
                current: width,
                userSet: width
            }
        };
    }

    case SET_CHAT_IS_RESIZING: {
        return {
            ...state,
            isResizing: action.resizing
        };
    }
    }

    return state;
});
