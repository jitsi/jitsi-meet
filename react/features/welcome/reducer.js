import { ReducerRegistry } from '../base/redux';
import { SET_SIDEBAR_VISIBILITY } from './actionTypes';

const DEFAULT_STATE = {
    sideBarVisible: false
};

/**
 * Reduces the Redux actions of the feature features/recording.
 */
ReducerRegistry.register('features/welcome',
    (state = DEFAULT_STATE, action) => {
        switch (action.type) {
        case SET_SIDEBAR_VISIBILITY:
            return {
                ...state,
                sideBarVisible: action.sideBarVisible
            };

        default:
            return state;
        }
    });
