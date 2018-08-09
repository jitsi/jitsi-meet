// @flow

import { ReducerRegistry } from '../redux';
import { PersistenceRegistry } from '../storage';

import { UPDATE_DROPBOX_TOKEN } from './actionTypes';

/**
 * The default state.
 */
const DEFAULT_STATE = {
    dropbox: {}
};

/**
 * The redux subtree of this feature.
 */
const STORE_NAME = 'features/base/oauth';

/**
 * Sets up the persistence of the feature {@code oauth}.
 */
PersistenceRegistry.register(STORE_NAME);

ReducerRegistry.register('features/base/oauth',
(state = DEFAULT_STATE, action) => {
    switch (action.type) {
    case UPDATE_DROPBOX_TOKEN:
        return {
            ...state,
            dropbox: {
                token: action.token
            }
        };
    default:
        return state;
    }
});
