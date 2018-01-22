/* @flow */

import { playAudio } from '../base/media';
import {
    getParticipantCount,
    PARTICIPANT_JOINED,
    PARTICIPANT_LEFT
} from '../base/participants';
import { MiddlewareRegistry } from '../base/redux';

import {
    PARTICIPANT_JOINED_SOUND_ID,
    PARTICIPANT_LEFT_SOUND_ID
} from './constants';

/**
 * Middleware that triggers {@link playAudio} action in response to various
 * events.
 *
 * @param {Store} store - Redux store.
 * @returns {Function}
 */
MiddlewareRegistry.register(store => next => action => {
    switch (action.type) {
    case PARTICIPANT_LEFT:
    case PARTICIPANT_JOINED: {
        _participantJoinedOrLeft(store, action);
        break;
    }
    }

    return next(action);
});

/**
 * Plays sounds when participants join/leave conference.
 *
 * @param {Store} store - The Redux store.
 * @param {Action} action - The Redux action. Should be either
 * {@link PARTICIPANT_JOINED} or {@link PARTICIPANT_LEFT}.
 * @private
 * @returns {void}
 */
function _participantJoinedOrLeft({ getState, dispatch }, action) {
    const state = getState();
    const { startAudioMuted } = state['features/base/config'];

    // We're not playing sounds for local participant
    // nor when the user is joining past the "startAudioMuted" limit.
    // The intention there was to not play user joined notification in big
    // conferences where 100th person is joining.
    if (!action.participant.local
        && (!startAudioMuted
            || getParticipantCount(state) < startAudioMuted)) {
        if (action.type === PARTICIPANT_JOINED) {
            dispatch(playAudio(PARTICIPANT_JOINED_SOUND_ID));
        } else if (action.type === PARTICIPANT_LEFT) {
            dispatch(playAudio(PARTICIPANT_LEFT_SOUND_ID));
        }
    }
}
