// @flow

import { setAudioOnly } from '../conference';
import { getLocalParticipant, participantUpdated } from '../participants';
import { MiddlewareRegistry, toState } from '../redux';

import { PROFILE_UPDATED } from './actionTypes';

/**
 * The middleware of the feature base/profile. Distributes changes to the state
 * of base/profile to the states of other features computed from the state of
 * base/profile.
 *
 * @param {Store} store - The redux store.
 * @returns {Function}
 */
MiddlewareRegistry.register(store => next => action => {
    const result = next(action);

    switch (action.type) {
    case PROFILE_UPDATED:
        _updateLocalParticipant(store);
        _maybeSetAudioOnly(store, action);
    }

    return result;
});

/**
 * Updates {@code startAudioOnly} flag if it's updated in the profile.
 *
 * @param {Store} store - The redux store.
 * @param {Object} action - The redux action.
 * @private
 * @returns {void}
 */
function _maybeSetAudioOnly(
        { dispatch },
        { profile: { startAudioOnly } }) {
    if (typeof startAudioOnly === 'boolean') {
        dispatch(setAudioOnly(startAudioOnly));
    }
}

/**
 * Updates the local participant according to profile changes.
 *
 * @param {Store} store - The redux store.
 * @private
 * @returns {void}
 */
function _updateLocalParticipant(store) {
    const state = toState(store);
    const localParticipant = getLocalParticipant(state);
    const profile = state['features/base/profile'];

    store.dispatch(participantUpdated({
        // Identify that the participant to update i.e. the local participant:
        id: localParticipant && localParticipant.id,
        local: true,

        // Specify the updates to be applied to the identified participant:
        email: profile.email,
        name: profile.displayName
    }));
}
