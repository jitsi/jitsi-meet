/* @flow */
import { PROFILE_UPDATED } from './actionTypes';
import MiddlewareRegistry from '../redux/MiddlewareRegistry';

import {
    getLocalParticipant,
    participantUpdated
} from '../participants';
import { getProfile } from '../profile';
import { toState } from '../redux';

/**
 * A MiddleWare to update the local participant when the profile
 * is updated.
 *
 * @param {Store} store - The redux store.
 * @returns {Function}
 */
MiddlewareRegistry.register(store => next => action => {
    const result = next(action);

    switch (action.type) {
    case PROFILE_UPDATED:
        _updateLocalParticipant(store);
    }

    return result;
});

/**
 * Updates the local participant according to profile changes.
 *
 * @param {Store} store - The redux store.
 * @returns {void}
 */
function _updateLocalParticipant(store) {
    const localParticipant = getLocalParticipant(toState(store));
    const profile = getProfile(toState(store));

    localParticipant.email = profile.email;
    localParticipant.name = profile.displayName;

    store.dispatch(participantUpdated(localParticipant));
}
