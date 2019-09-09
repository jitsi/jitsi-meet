// @flow

import { ReducerRegistry } from '../../base/redux';

import {
    _SET_APP_STATE_LISTENER,
    APP_STATE_CHANGED
} from './actionTypes';

/**
 * The default/initial redux state of the feature background.
 */
const DEFAULT_STATE = {
    appState: 'active'
};

ReducerRegistry.register('features/background', (state = DEFAULT_STATE, action) => {
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
