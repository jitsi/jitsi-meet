// @flow

import { PersistencyRegistry, ReducerRegistry } from '../redux';

import { PROFILE_UPDATED } from './actionTypes';

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
