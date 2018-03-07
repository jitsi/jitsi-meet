// @flow

import { ReducerRegistry } from '../base/redux';

import {
    ADD_MESSAGE,
    SET_LAST_READ_MESSAGE
} from './actionTypes';

const DEFAULT_STATE = {
    open: false,
    messages: [],
    lastReadMessage: null
};

ReducerRegistry.register('features/chat', (state = DEFAULT_STATE, action) => {
    switch (action.type) {
    case ADD_MESSAGE: {
        const newMessage = {
            message: action.message,
            timestamp: action.timestamp,
            userName: action.userName
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

    case SET_LAST_READ_MESSAGE:
        return {
            ...state,
            lastReadMessage: action.message
        };
    }

    return state;
});
