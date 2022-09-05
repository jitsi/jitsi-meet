import ReducerRegistry from '../../base/redux/ReducerRegistry';

import { _SET_IMMERSIVE_LISTENER } from './actionTypes';

export interface IFullScreenState {
    listener?: Function;
}

ReducerRegistry.register<IFullScreenState>('features/full-screen', (state = {}, action): IFullScreenState => {
    switch (action.type) {
    case _SET_IMMERSIVE_LISTENER:
        return {
            ...state,
            listener: action.listener
        };
    }

    return state;
});
