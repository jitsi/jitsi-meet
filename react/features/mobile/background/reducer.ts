import {AppStateStatus, NativeEventSubscription} from 'react-native';

import ReducerRegistry from '../../base/redux/ReducerRegistry';

import {
    APP_STATE_CHANGED,
    EVENT_SUBSCRIPTION,
    _SET_APP_STATE_LISTENER,
} from './actionTypes';

export interface IBackgroundState {
    appState: string;
    appStateListener?: (state: AppStateStatus) => void;
    subscription?: NativeEventSubscription;
}

/**
 * The default/initial redux state of the feature background.
 */
const DEFAULT_STATE = {
    appState: 'active'
};

ReducerRegistry.register<IBackgroundState>('features/background', (state = DEFAULT_STATE, action): IBackgroundState => {
    switch (action.type) {
    case _SET_APP_STATE_LISTENER:
        return {
            ...state,
            appStateListener: action.listener
        };

    case EVENT_SUBSCRIPTION:
        return {
            ...state,
            subscription: action.subscription
        };

    case APP_STATE_CHANGED:
        return {
            ...state,
            appState: action.appState
        };
    }

    return state;
});
