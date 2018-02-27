// @flow

import { APP_WILL_MOUNT } from '../../app';
import { ReducerRegistry } from '../redux';
import { PersistenceRegistry } from '../storage';

import { PROFILE_UPDATED } from './actionTypes';

/**
 * The default/initial redux state of the feature {@code base/profile}.
 *
 * @type Object
 */
const DEFAULT_STATE = {};

const STORE_NAME = 'features/base/profile';

/**
 * Sets up the persistence of the feature {@code base/profile}.
 */
PersistenceRegistry.register(STORE_NAME);

ReducerRegistry.register(STORE_NAME, (state = DEFAULT_STATE, action) => {
    switch (action.type) {
    case APP_WILL_MOUNT:
        // XXX APP_WILL_MOUNT is the earliest redux action of ours dispatched in
        // the store. For the purposes of legacy support, make sure that the
        // deserialized base/profile's state is in the format deemed current by
        // the current app revision.
        if (state && typeof state === 'object') {
            // In an enterprise/internal build of Jitsi Meet for Android and iOS
            // we had base/profile's state as an object with property profile.
            const { profile } = state;

            if (profile && typeof profile === 'object') {
                return { ...profile };
            }
        } else {
            // In the weird case that we have previously persisted/serialized
            // null.
            return DEFAULT_STATE;
        }
        break;

    case PROFILE_UPDATED:
        return {
            ...state,
            ...action.profile
        };
    }

    return state;
});
