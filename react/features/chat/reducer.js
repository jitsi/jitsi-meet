// @flow

import { PersistenceRegistry, ReducerRegistry } from '../base/redux';

import {
    ADD_MESSAGE,
    CLEAR_MESSAGES,
    CLOSE_CHAT,
    OPEN_CHAT,
    OPEN_CHAT_BACKGROUND,
    CLOSE_CHAT_BACKGROUND,
    SET_CHAT_BACKGROUND,
    SET_PRIVATE_MESSAGE_RECIPIENT
} from './actionTypes';

const DEFAULT_STATE = {
    chatBackgroundImage: undefined,
    isBackgroundOpen: false,
    isOpen: false,
    lastReadMessage: undefined,
    messages: [],
    privateMessageRecipient: undefined
};

const STORE_NAME = 'features/chat';

PersistenceRegistry.register(STORE_NAME, true,  {
    chatBackgroundImage: true,
    messages: false,
    lastReadMessage: false,
    privateMessageRecipient: false,
    isBackgroundOpen: false,
    isOpen: false,
});

ReducerRegistry.register(STORE_NAME, (state = DEFAULT_STATE, action) => {

    switch (action.type) {
    case ADD_MESSAGE: {
        const newMessage = {
            displayName: action.displayName,
            error: action.error,
            id: action.id,
            messageType: action.messageType,
            message: action.message,
            privateMessage: action.privateMessage,
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
            messages
        };
    }

    case CLEAR_MESSAGES:
        return {
            ...state,
            lastReadMessage: undefined,
            messages: []
        };

    case SET_PRIVATE_MESSAGE_RECIPIENT:
        return {
            ...state,
            privateMessageRecipient: action.participant
        };
    case SET_CHAT_BACKGROUND:
        return {
            ...state,
            chatBackgroundImage: action.chatBackgroundImage
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
            privateMessageRecipient: action.participant
        };
    case OPEN_CHAT_BACKGROUND:
        return {
            ...state,
            isBackgroundOpen: true
        };
    case CLOSE_CHAT_BACKGROUND:
        return {
            ...state,
            isBackgroundOpen: false
        };
    }

    return state;
});
