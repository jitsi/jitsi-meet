// @flow

import { PersistenceRegistry, ReducerRegistry } from '../base/redux';

import { UPDATE_DROPBOX_TOKEN } from './actionTypes';

/**
 * The redux subtree of this feature.
 */
const STORE_NAME = 'features/dropbox';

/**
 * Sets up the persistence of the feature {@code dropbox}.
 */
PersistenceRegistry.register(STORE_NAME);

ReducerRegistry.register(STORE_NAME, (state = {}, action) => {
    switch (action.type) {
    case UPDATE_DROPBOX_TOKEN:
        return {
            ...state,
            token: action.token
        };
    default:
        return state;
    }
});
