import { ReducerRegistry } from '../../base/redux';

import {
    _SET_CALLKIT_LISTENERS
} from './actionTypes';

ReducerRegistry.register('features/callkit', (state = {}, action) => {
    switch (action.type) {
    case _SET_CALLKIT_LISTENERS:
        return {
            ...state,
            listeners: action.listeners
        };
    }

    return state;
});
