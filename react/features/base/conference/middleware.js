import { CONNECTION_ESTABLISHED } from '../connection';
import {
    getLocalParticipant,
    getParticipantById,
    PIN_PARTICIPANT
} from '../participants';
import { MiddlewareRegistry } from '../redux';
import { TRACK_ADDED, TRACK_REMOVED } from '../tracks';

import { createConference } from './actions';
import {
    _addLocalTracksToConference,
    _handleParticipantError,
    _removeLocalTracksFromConference
} from './functions';

/**
 * Implements the middleware of the feature base/conference.
 *
 * @param {Store} store - Redux store.
 * @returns {Function}
 */
MiddlewareRegistry.register(store => next => action => {
    switch (action.type) {
    case CONNECTION_ESTABLISHED:
        return _connectionEstablished(store, next, action);

    case PIN_PARTICIPANT:
        return _pinParticipant(store, next, action);

    case TRACK_ADDED:
    case TRACK_REMOVED:
        return _trackAddedOrRemoved(store, next, action);
    }

    return next(action);
});

/**
 * Notifies the feature base/conference that the action CONNECTION_ESTABLISHED
 * is being dispatched within a specific Redux store.
 *
 * @param {Store} store - The Redux store in which the specified action is being
 * dispatched.
 * @param {Dispatch} next - The Redux dispatch function to dispatch the
 * specified action to the specified store.
 * @param {Action} action - The Redux action CONNECTION_ESTABLISHED which is
 * being dispatched in the specified store.
 * @private
 * @returns {Object} The new state that is the result of the reduction of the
 * specified action.
 */
function _connectionEstablished(store, next, action) {
    const result = next(action);

    store.dispatch(createConference());

    return result;
}

/**
 * Notifies the feature base/conference that the action PIN_PARTICIPANT is being
 * dispatched within a specific Redux store. Pins the specified remote
 * participant in the associated conference, ignores the local participant.
 *
 * @param {Store} store - The Redux store in which the specified action is being
 * dispatched.
 * @param {Dispatch} next - The Redux dispatch function to dispatch the
 * specified action to the specified store.
 * @param {Action} action - The Redux action PIN_PARTICIPANT which is being
 * dispatched in the specified store.
 * @private
 * @returns {Object} The new state that is the result of the reduction of the
 * specified action.
 */
function _pinParticipant(store, next, action) {
    const state = store.getState();
    const participants = state['features/base/participants'];
    const id = action.participant.id;
    const participantById = getParticipantById(participants, id);
    let pin;

    // The following condition prevents signaling to pin local participant. The
    // logic is:
    // - If we have an ID, we check if the participant identified by that ID is
    //   local.
    // - If we don't have an ID (i.e. no participant identified by an ID), we
    //   check for local participant. If she's currently pinned, then this
    //   action will unpin her and that's why we won't signal here too.
    if (participantById) {
        pin = !participantById.local;
    } else {
        const localParticipant = getLocalParticipant(participants);

        pin = !localParticipant || !localParticipant.pinned;
    }
    if (pin) {
        const conference = state['features/base/conference'].conference;

        try {
            conference.pinParticipant(id);
        } catch (err) {
            _handleParticipantError(err);
        }
    }

    return next(action);
}

/**
 * Synchronizes local tracks from state with local tracks in JitsiConference
 * instance.
 *
 * @param {Store} store - Redux store.
 * @param {Object} action - Action object.
 * @private
 * @returns {Promise}
 */
function _syncConferenceLocalTracksWithState(store, action) {
    const state = store.getState()['features/base/conference'];
    const conference = state.conference;
    let promise;

    // XXX The conference may already be in the process of being left, that's
    // why we should not add/remove local tracks to such conference.
    if (conference && conference !== state.leaving) {
        const track = action.track.jitsiTrack;

        if (action.type === TRACK_ADDED) {
            promise = _addLocalTracksToConference(conference, [ track ]);
        } else {
            promise = _removeLocalTracksFromConference(conference, [ track ]);
        }
    }

    return promise || Promise.resolve();
}

/**
 * Notifies the feature base/conference that the action TRACK_ADDED
 * or TRACK_REMOVED is being dispatched within a specific Redux store.
 *
 * @param {Store} store - The Redux store in which the specified action is being
 * dispatched.
 * @param {Dispatch} next - The Redux dispatch function to dispatch the
 * specified action to the specified store.
 * @param {Action} action - The Redux action TRACK_ADDED or TRACK_REMOVED which
 * is being dispatched in the specified store.
 * @private
 * @returns {Object} The new state that is the result of the reduction of the
 * specified action.
 */
function _trackAddedOrRemoved(store, next, action) {
    const track = action.track;

    if (track && track.local) {
        return (
            _syncConferenceLocalTracksWithState(store, action)
                .then(() => next(action)));
    }

    return next(action);
}
