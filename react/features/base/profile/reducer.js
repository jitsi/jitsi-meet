// @flow

import {
    PROFILE_UPDATED
} from './actionTypes';

import { PersistencyRegistry, ReducerRegistry } from '../redux';

const DEFAULT_STATE = {
    profile: {}
};

const STORE_NAME = 'features/base/profile';

PersistencyRegistry.register(STORE_NAME, {
    profile: true
});

ReducerRegistry.register(
    STORE_NAME, (state = DEFAULT_STATE, action) => {
        switch (action.type) {
        case PROFILE_UPDATED:
            return {
                profile: action.profile
            };
        }

        return state;
    });
