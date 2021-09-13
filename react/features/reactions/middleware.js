// @flow

import { batch } from 'react-redux';

import { APP_WILL_MOUNT, APP_WILL_UNMOUNT } from '../base/app';
import { MiddlewareRegistry } from '../base/redux';
import { updateSettings } from '../base/settings';
import { playSound, registerSound, unregisterSound } from '../base/sounds';
import { isVpaasMeeting } from '../jaas/functions';
import { NOTIFICATION_TIMEOUT, showNotification } from '../notifications';

import {
    ADD_REACTION_BUFFER,
    FLUSH_REACTION_BUFFER,
    SEND_REACTIONS,
    PUSH_REACTIONS,
    SHOW_SOUNDS_NOTIFICATION
} from './actionTypes';
import { displayReactionSoundsNotification } from './actions';
import {
    addReactionsToChat,
    flushReactionBuffer,
    pushReactions,
    sendReactions,
    setReactionQueue
} from './actions.any';
import { ENDPOINT_REACTION_NAME, RAISE_HAND_SOUND_ID, REACTIONS, SOUNDS_THRESHOLDS } from './constants';
import {
    getReactionMessageFromBuffer,
    getReactionsSoundsThresholds,
    getReactionsWithId,
    sendReactionsWebhook
} from './functions.any';
import { RAISE_HAND_SOUND_FILE } from './sounds';


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
            Object.keys(REACTIONS).forEach(key => {
                for (let i = 0; i < SOUNDS_THRESHOLDS.length; i++) {
                    dispatch(registerSound(
                        `${REACTIONS[key].soundId}${SOUNDS_THRESHOLDS[i]}`,
                        REACTIONS[key].soundFiles[i]
                    )
                    );
                }
            }
            );
            dispatch(registerSound(RAISE_HAND_SOUND_ID, RAISE_HAND_SOUND_FILE));
        });
        break;

    case APP_WILL_UNMOUNT:
        batch(() => {
            Object.keys(REACTIONS).forEach(key => {
                for (let i = 0; i < SOUNDS_THRESHOLDS.length; i++) {
                    dispatch(unregisterSound(`${REACTIONS[key].soundId}${SOUNDS_THRESHOLDS[i]}`));
                }
            });
            dispatch(unregisterSound(RAISE_HAND_SOUND_ID));
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
        const { queue, notificationDisplayed } = state['features/reactions'];
        const { soundsReactions } = state['features/base/settings'];
        const reactions = action.reactions;

        batch(() => {
            if (!notificationDisplayed && soundsReactions && displayReactionSoundsNotification) {
                dispatch(displayReactionSoundsNotification());
            }
            if (soundsReactions) {
                const reactionSoundsThresholds = getReactionsSoundsThresholds(reactions);

                reactionSoundsThresholds.forEach(reaction =>
                    dispatch(playSound(`${REACTIONS[reaction.reaction].soundId}${reaction.threshold}`))
                );
            }
            dispatch(setReactionQueue([ ...queue, ...getReactionsWithId(reactions) ]));
        });
        break;
    }

    case SHOW_SOUNDS_NOTIFICATION: {
        dispatch(showNotification({
            titleKey: 'toolbar.disableReactionSounds',
            customActionNameKey: 'notify.reactionSounds',
            customActionHandler: () => dispatch(updateSettings({
                soundsReactions: false
            }))
        }, NOTIFICATION_TIMEOUT));
        break;
    }
    }

    return next(action);
});
