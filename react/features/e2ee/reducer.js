// @flow

import { ReducerRegistry } from '../base/redux';

import {
    SET_EVERYONE_ENABLED,
    SET_EVERYONE_SUPPORTS,
    TOGGLE_E2EE
} from './actionTypes';

const DEFAULT_STATE = {
    enabled: false
};

/**
 * Reduces the Redux actions of the feature features/e2ee.
 */
ReducerRegistry.register('features/e2ee', (state = DEFAULT_STATE, action) => {
    switch (action.type) {
    case TOGGLE_E2EE:
        return {
            ...state,
            enabled: action.enabled
        };
    case SET_EVERYONE_ENABLED:
        return {
            ...state,
            everyoneEnabledE2EE: action.everyoneEnabledE2EE
        };
    case SET_EVERYONE_SUPPORTS:
        return {
            ...state,
            everyoneSupportsE2EE: action.everyoneSupportsE2EE
        };

    default:
        return state;
    }
});
