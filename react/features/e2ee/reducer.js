// @flow

import { ReducerRegistry } from '../base/redux';

import { SET_E2EE_KEY } from './actionTypes';

const DEFAULT_STATE = {

    /**
     * E2EE key.
     */
    e2eeKey: undefined
};

/**
 * Reduces the Redux actions of the feature features/e2ee.
 */
ReducerRegistry.register('features/e2ee', (state = DEFAULT_STATE, action) => {
    switch (action.type) {
    case SET_E2EE_KEY:
        return {
            ...state,
            e2eeKey: action.key
        };

    default:
        return state;
    }
});
