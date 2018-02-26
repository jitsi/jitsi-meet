// @flow

import { ReducerRegistry } from '../base/redux';
import { SET_SIDEBAR_VISIBLE } from './actionTypes';

/**
 * Reduces redux actions for the purposes of {@code features/welcome}.
 */
ReducerRegistry.register('features/welcome', (state = {}, action) => {
    switch (action.type) {
    case SET_SIDEBAR_VISIBLE:
        return {
            ...state,
            sideBarVisible: action.visible
        };

    default:
        return state;
    }
});
