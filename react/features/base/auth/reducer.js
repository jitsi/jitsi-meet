// @flow

import { ReducerRegistry } from '../redux';

// import { PersistenceRegistry } from '../storage';

import { CURRENT_USER_UPDATED } from './actionTypes';

/**
 * The default/initial redux state of the feature {@code base/settings}.
 *
 * @type Object
 */
const DEFAULT_STATE = {
    user: undefined
};

const STORE_NAME = 'features/base/auth';

// PersistenceRegistry.register(STORE_NAME);

ReducerRegistry.register(STORE_NAME, (state = DEFAULT_STATE, action) => {
    switch (action.type) {
    case CURRENT_USER_UPDATED:
        return {
            ...state,
            user: action.user
        };
    }

    return state;
});
