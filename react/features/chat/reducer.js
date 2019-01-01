// @flow

import { ReducerRegistry } from '../base/redux';

import { ADD_MESSAGE, CLEAR_MESSAGES, TOGGLE_CHAT } from './actionTypes';

const DEFAULT_STATE = {
    isOpen: false,
    lastReadMessage: undefined,
    messages: []
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
            timestamp: action.timestamp
        };

        return {
            ...state,
            lastReadMessage:
                action.hasRead ? newMessage : state.lastReadMessage,
            messages: [
                ...state.messages,
                newMessage
            ]
        };
    }

    case CLEAR_MESSAGES:
        return {
            ...state,
            lastReadMessage: undefined,
            messages: []
        };

    case TOGGLE_CHAT:
        return {
            ...state,
            isOpen: !state.isOpen,
            lastReadMessage: state.messages[state.messages.length - 1]
        };
    }

    return state;
});
