// @flow

import {
    DOMINANT_SPEAKER_CHANGED,
    PARTICIPANT_JOINED,
    PARTICIPANT_LEFT,
    PIN_PARTICIPANT,
    getLocalParticipant
} from '../base/participants';
import { MiddlewareRegistry } from '../base/redux';
import { isTestModeEnabled } from '../base/testing';
import {
    TRACK_ADDED,
    TRACK_REMOVED
} from '../base/tracks';

import { selectParticipantInLargeVideo } from './actions';
import logger from './logger';

import './subscriber';

/**
 * Middleware that catches actions related to participants and tracks and
 * dispatches an action to select a participant depicted by LargeVideo.
 *
 * @param {Store} store - Redux store.
 * @returns {Function}
 */
MiddlewareRegistry.register(store => next => action => {
    const result = next(action);

    switch (action.type) {
    case DOMINANT_SPEAKER_CHANGED: {
        const state = store.getState();
        const localParticipant = getLocalParticipant(state);

        if (isTestModeEnabled(state)) {
            logger.info(`Dominant speaker changed event for: ${action.participant.id}`);
        }

        if (localParticipant && localParticipant.id !== action.participant.id) {
            store.dispatch(selectParticipantInLargeVideo());
        }

        break;
    }
    case PARTICIPANT_JOINED:
    case PARTICIPANT_LEFT:
    case PIN_PARTICIPANT:
    case TRACK_ADDED:
    case TRACK_REMOVED:
        store.dispatch(selectParticipantInLargeVideo());
        break;
    }

    return result;
});
