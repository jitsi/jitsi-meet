import { ReducerRegistry } from '../../base/redux';

import {
    _SET_APP_STATE_LISTENER,
    APP_STATE_CHANGED
} from './actionTypes';

ReducerRegistry.register('features/background', (state = {}, action) => {
    switch (action.type) {
    case _SET_APP_STATE_LISTENER:
        return {
            ...state,
            appStateListener: action.listener
        };

    case APP_STATE_CHANGED:
        return {
            ...state,
            appState: action.appState
        };
    }

    return state;
});
