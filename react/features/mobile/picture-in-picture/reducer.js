import { ReducerRegistry } from '../../base/redux';

import { _SET_PIP_LISTENERS } from './actionTypes';

ReducerRegistry.register('features/pip', (state = {}, action) => {
    switch (action.type) {
    case _SET_PIP_LISTENERS:
        return {
            ...state,
            listeners: action.listeners
        };
    }

    return state;
});
