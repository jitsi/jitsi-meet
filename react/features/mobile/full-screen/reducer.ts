import ReducerRegistry from '../../base/redux/ReducerRegistry';

import { _SET_IMMERSIVE_LISTENER } from './actionTypes';

export interface IFullScreenState {
    listener?: Function;
}

ReducerRegistry.register('features/full-screen', (state: IFullScreenState = {}, action) => {
    switch (action.type) {
    case _SET_IMMERSIVE_LISTENER:
        return {
            ...state,
            listener: action.listener
        };
    }

    return state;
});
