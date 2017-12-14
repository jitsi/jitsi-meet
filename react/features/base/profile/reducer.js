// @flow

import {
    PROFILE_UPDATED
} from './actionTypes';

import { ReducerRegistry } from '../redux';

const DEFAULT_STATE = {
    profile: {}
};

const STORE_NAME = 'features/base/profile';

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
