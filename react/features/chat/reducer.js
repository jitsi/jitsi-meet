// @flow

import { ReducerRegistry } from '../base/redux';

import {
    ADD_MESSAGE,
    CLEAR_MESSAGES,
    CLOSE_CHAT,
    OPEN_CHAT,
    SET_PRIVATE_MESSAGE_RECIPIENT
} from './actionTypes';

const DEFAULT_STATE = {
    isOpen: false,
    lastReadMessage: undefined,
    messages: [],
    privateMessageRecipient: undefined
};

ReducerRegistry.register('features/chat', (state = DEFAULT_STATE, action) => {
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
    }

    return state;
});
