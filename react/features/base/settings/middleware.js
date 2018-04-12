// @flow

import { setAudioOnly } from '../conference';
import { getLocalParticipant, participantUpdated } from '../participants';
import { MiddlewareRegistry, toState } from '../redux';

import { SETTINGS_UPDATED } from './actionTypes';
import { getSettings } from './functions';

/**
 * The middleware of the feature base/settings. Distributes changes to the state
 * of base/settings to the states of other features computed from the state of
 * base/settings.
 *
 * @param {Store} store - The redux store.
 * @returns {Function}
 */
MiddlewareRegistry.register(store => next => action => {
    const result = next(action);

    switch (action.type) {
    case SETTINGS_UPDATED:
        _maybeSetAudioOnly(store, action);
        _updateLocalParticipant(store);
    }

    return result;
});

/**
 * Updates {@code startAudioOnly} flag if it's updated in the settings.
 *
 * @param {Store} store - The redux store.
 * @param {Object} action - The redux action.
 * @private
 * @returns {void}
 */
function _maybeSetAudioOnly(
        { dispatch },
        { settings: { startAudioOnly } }) {
    if (typeof startAudioOnly === 'boolean') {
        dispatch(setAudioOnly(startAudioOnly));
    }
}

/**
 * Updates the local participant according to settings changes.
 *
 * @param {Store} store - The redux store.
 * @private
 * @returns {void}
 */
function _updateLocalParticipant(store) {
    const state = toState(store);
    const localParticipant = getLocalParticipant(state);
    const settings = getSettings(state);

    store.dispatch(participantUpdated({
        // Identify that the participant to update i.e. the local participant:
        id: localParticipant && localParticipant.id,
        local: true,

        // Specify the updates to be applied to the identified participant:
        email: settings.email,
        name: settings.displayName
    }));
}
