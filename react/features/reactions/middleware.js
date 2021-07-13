// @flow

import { ENDPOINT_REACTION_NAME } from '../../../modules/API/constants';
import { MiddlewareRegistry } from '../base/redux';

import {
    SET_REACTIONS_MESSAGE,
    CLEAR_REACTIONS_MESSAGE,
    SEND_REACTION,
    PUSH_REACTION
} from './actionTypes';
import {
    addReactionsMessage,
    addReactionsMessageToChat,
    flushReactionsToChat,
    pushReaction,
    setReactionQueue
} from './actions.any';
import { REACTIONS } from './constants';


declare var APP: Object;

/**
 * Middleware which intercepts Reactions actions to handle changes to the
 * visibility timeout of the Reactions.
 *
 * @param {Store} store - The redux store.
 * @returns {Function}
 */
MiddlewareRegistry.register(store => next => action => {
    const { dispatch, getState } = store;

    switch (action.type) {
    case SET_REACTIONS_MESSAGE: {
        const { timeoutID, message } = getState()['features/reactions'];
        const { reaction } = action;

        clearTimeout(timeoutID);
        action.message = `${message}${reaction}`;
        action.timeoutID = setTimeout(() => {
            dispatch(flushReactionsToChat());
        }, 500);

        break;
    }

    case CLEAR_REACTIONS_MESSAGE: {
        const { message } = getState()['features/reactions'];

        dispatch(addReactionsMessageToChat(message));

        break;
    }

    case SEND_REACTION: {
        const state = store.getState();
        const { conference } = state['features/base/conference'];

        if (conference) {
            conference.sendEndpointMessage('', {
                name: ENDPOINT_REACTION_NAME,
                reaction: action.reaction,
                timestamp: Date.now()
            });
            dispatch(addReactionsMessage(REACTIONS[action.reaction].message));
            dispatch(pushReaction(action.reaction));
        }
        break;
    }

    case PUSH_REACTION: {
        const queue = store.getState()['features/reactions'].queue;
        const reaction = action.reaction;

        dispatch(setReactionQueue([ ...queue, {
            reaction,
            uid: window.Date.now()
        } ]));
    }
    }

    return next(action);
});
