// @flow

import { SET_ACTIVE_MODAL_ID } from '../base/modal';
import { ReducerRegistry } from '../base/redux';

import {
    ADD_MESSAGE,
    CLEAR_MESSAGES,
    SET_PRIVATE_MESSAGE_RECIPIENT,
    TOGGLE_CHAT
} from './actionTypes';
import { CHAT_VIEW_MODAL_ID } from './constants';

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

    case SET_ACTIVE_MODAL_ID:
        if (action.activeModalId === CHAT_VIEW_MODAL_ID) {
            return updateChatState(state);
        }

        break;
    case SET_PRIVATE_MESSAGE_RECIPIENT:
        return {
            ...state,
            isOpen: Boolean(action.participant) || state.isOpen,
            privateMessageRecipient: action.participant
        };

    case TOGGLE_CHAT:
        return updateChatState(state);
    }

    return state;
});

/**
 * Updates the chat status on opening the chat view.
 *
 * @param {Object} state - The Redux state of the feature.
 * @returns {Object}
 */
function updateChatState(state) {
    return {
        ...state,
        isOpen: !state.isOpen,
        lastReadMessage: state.messages[
            navigator.product === 'ReactNative' ? 0 : state.messages.length - 1],
        privateMessageRecipient: state.isOpen ? undefined : state.privateMessageRecipient
    };
}
