import { ReducerRegistry } from '../base/redux';

import { SET_VISIBLE_PANEL } from './actionTypes';

/**
 * Reduces the Redux actions of the feature features/side-panel.
 */
ReducerRegistry.register('features/side-panel', (state = {}, action) => {
    switch (action.type) {
    case SET_VISIBLE_PANEL:
        return {
            ...state,
            current: action.current
        };
    }

    return state;
});
