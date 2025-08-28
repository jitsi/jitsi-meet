import { NativeEventSubscription } from 'react-native';

import ReducerRegistry from '../../base/redux/ReducerRegistry';

import { _SET_IMMERSIVE_SUBSCRIPTION } from './actionTypes';

export interface IFullScreenState {
    subscription?: NativeEventSubscription;
}

ReducerRegistry.register<IFullScreenState>('features/full-screen', (state = {}, action): IFullScreenState => {
    switch (action.type) {
    case _SET_IMMERSIVE_SUBSCRIPTION:
        return {
            ...state,
            subscription: action.subscription
        };
    }

    return state;
});
