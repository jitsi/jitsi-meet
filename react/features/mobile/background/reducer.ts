import { NativeEventSubscription } from 'react-native';

import ReducerRegistry from '../../base/redux/ReducerRegistry';

import { APP_STATE_CHANGED, _SET_APP_STATE_SUBSCRIPTION } from './actionTypes';

export interface IBackgroundState {
    appState: string;
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

    case _SET_APP_STATE_SUBSCRIPTION:
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
