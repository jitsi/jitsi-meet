// @flow

import { batch } from 'react-redux';

import { ENDPOINT_REACTION_NAME } from '../../../modules/API/constants';
import { APP_WILL_MOUNT, APP_WILL_UNMOUNT } from '../base/app';
import { MiddlewareRegistry } from '../base/redux';
import { playSound, registerSound, unregisterSound } from '../base/sounds';
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
import { REACTIONS } from './constants';
import {
    getReactionMessageFromBuffer,
    getReactionsWithId,
    getUniqueReactions,
    sendReactionsWebhook
} from './functions.any';


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
    case APP_WILL_MOUNT:
        batch(() => {
            Object.keys(REACTIONS).forEach(key =>
                dispatch(registerSound(REACTIONS[key].soundId, REACTIONS[key].soundFile))
            );
        });
        break;

    case APP_WILL_UNMOUNT:
        batch(() => {
            Object.keys(REACTIONS).forEach(key => dispatch(unregisterSound(REACTIONS[key].soundId)));
        });
        break;

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
        const state = getState();
        const queue = state['features/reactions'].queue;
        const { soundsReactions } = state['features/base/settings'];
        const reactions = action.reactions;

        const uniqueReactions = getUniqueReactions(reactions);

        batch(() => {
            if (soundsReactions) {
                uniqueReactions.forEach(reaction => dispatch(playSound(REACTIONS[reaction].soundId)));
            }
            dispatch(setReactionQueue([ ...queue, ...getReactionsWithId(reactions) ]));
        });
    }
    }

    return next(action);
});
