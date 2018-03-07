// @flow

import { ReducerRegistry } from '../base/redux';

import {
    ETHERPAD_INITIALIZED,
    SET_DOCUMENT_EDITING_STATUS
} from './actionTypes';

/**
 * Reduces the Redux actions of the feature features/etherpad.
 */
ReducerRegistry.register('features/etherpad', (state = {}, action) => {
    switch (action.type) {
    case ETHERPAD_INITIALIZED:
        return {
            ...state,
            initialized: true
        };

    case SET_DOCUMENT_EDITING_STATUS:
        return {
            ...state,
            editing: action.editing
        };

    default:
        return state;
    }
});
