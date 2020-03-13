// @flow

import { ReducerRegistry } from '../base/redux';

import {
    ETHERDRAW_INITIALIZED,
    SET_DRAW_EDITING_STATUS
} from './actionTypes';

/**
 * Reduces the Redux actions of the feature features/ethedraw.
 */
ReducerRegistry.register('features/etherdraw', (state = {}, action) => {
    switch (action.type) {
    case ETHERDRAW_INITIALIZED:
        return {
            ...state,
            initialized: true
        };

    case SET_DRAW_EDITING_STATUS:
        return {
            ...state,
            editing: action.editing
        };

    default:
        return state;
    }
});
