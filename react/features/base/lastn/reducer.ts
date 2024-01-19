import ReducerRegistry from '../redux/ReducerRegistry';

import { SET_LAST_N } from './actionTypes';

export interface ILastNState {
    lastN?: number;
}

ReducerRegistry.register<ILastNState>('features/base/lastn', (state = {}, action): ILastNState => {
    switch (action.type) {
    case SET_LAST_N: {
        const { lastN } = action;

        return {
            ...state,
            lastN
        };
    }
    }

    return state;
});
