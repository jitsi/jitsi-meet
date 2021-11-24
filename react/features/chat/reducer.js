// @flow

import { ReducerRegistry } from '../base/redux';

import {
    ADD_MESSAGE,
    CLEAR_MESSAGES,
    CLOSE_CHAT,
    OPEN_CHAT,
    SET_PRIVATE_MESSAGE_RECIPIENT,
    SET_IS_POLL_TAB_FOCUSED,
    SET_CHALLENGE_RESPONSE_RECIPIENT,
    SET_CHALLENGE_RESPONSE_ACTIVE_STATE,
    REMOVE_CHALLENGE_RESPONSE_PARTICIPANT
} from './actionTypes';

const DEFAULT_STATE = {
    isOpen: false,
    isPollsTabFocused: false,
    lastReadMessage: undefined,
    lastReadPoll: undefined,
    messages: [],
    nbUnreadMessages: 0,
    privateMessageRecipient: undefined,
    challengeResponseRecipient: undefined,
    challengeResponseIsActive: false
};

ReducerRegistry.register('features/chat', (state = DEFAULT_STATE, action) => {
    switch (action.type) {
    case ADD_MESSAGE: {
        const newMessage = {
            displayName: action.displayName,
            error: action.error,
            id: action.id,
            isReaction: action.isReaction,
            messageType: action.messageType,
            message: action.message,
            privateMessage: action.privateMessage,
            challengeResponse: action.challengeResponse,
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
            privateMessageRecipient: action.participant,
            challengeResponseIsActive: false
        };

    case SET_IS_POLL_TAB_FOCUSED: {
        return {
            ...state,
            isPollsTabFocused: action.isPollsTabFocused,
            nbUnreadMessages: 0
        }; }
    case SET_CHALLENGE_RESPONSE_RECIPIENT:
        return {
            ...state,
            challengeResponseIsActive: true,
            challengeResponseRecipient: action.participant,
            privateMessageRecipient: undefined,
            isOpen: action.open
        };
    case SET_CHALLENGE_RESPONSE_ACTIVE_STATE:
        return {
            ...state,
            challengeResponseIsActive: action.payload,
            isOpen: action.payload || state.isOpen,
            privateMessageRecipient: undefined
        };
    case REMOVE_CHALLENGE_RESPONSE_PARTICIPANT:
        return {
            ...state,
            messages: state.messages.filter(m => {
                if (action.removeChallengeResponses) {
                    return !m.challengeResponse;
                }

                return true;
            }),
            isOpen: state.isOpen && state.challengeResponseIsActive ? false : state.isOpen,
            challengeResponseIsActive: false,
            challengeResponseRecipient: undefined
        };
    }

    return state;
});
