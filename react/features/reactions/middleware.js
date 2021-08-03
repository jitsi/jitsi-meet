// @flow

import { batch } from 'react-redux';

import { ENDPOINT_REACTION_NAME } from '../../../modules/API/constants';
import { MiddlewareRegistry } from '../base/redux';
import { isVpaasMeeting } from '../jaas/functions';

import {
    ADD_REACTION_BUFFER,
    FLUSH_REACTION_BUFFER,
    SEND_REACTIONS,
    PUSH_REACTIONS
} from './actionTypes';
import {
    addReactionsToChat,
    flushReactionBuffer,
    pushReactions,
    sendReactions,
    setReactionQueue
} from './actions.any';
import { getReactionMessageFromBuffer, getReactionsWithId, sendReactionsWebhook } from './functions.any';


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
    case ADD_REACTION_BUFFER: {
        const { timeoutID, buffer } = getState()['features/reactions'];
        const { reaction } = action;

        clearTimeout(timeoutID);
        buffer.push(reaction);
        action.buffer = buffer;
        action.timeoutID = setTimeout(() => {
            dispatch(flushReactionBuffer());
        }, 500);

        break;
    }

    case FLUSH_REACTION_BUFFER: {
        const state = getState();
        const { buffer } = state['features/reactions'];

        batch(() => {
            dispatch(sendReactions());
            dispatch(addReactionsToChat(getReactionMessageFromBuffer(buffer)));
            dispatch(pushReactions(buffer));
        });

        if (isVpaasMeeting(state)) {
            sendReactionsWebhook(state, buffer);
        }

        break;
    }

    case SEND_REACTIONS: {
        const state = getState();
        const { buffer } = state['features/reactions'];
        const { conference } = state['features/base/conference'];

        if (conference) {
            conference.sendEndpointMessage('', {
                name: ENDPOINT_REACTION_NAME,
                reactions: buffer,
                timestamp: Date.now()
            });
        }
        break;
    }

    case PUSH_REACTIONS: {
        const queue = store.getState()['features/reactions'].queue;
        const reactions = action.reactions;

        dispatch(setReactionQueue([ ...queue, ...getReactionsWithId(reactions) ]));
    }
    }

    return next(action);
});
