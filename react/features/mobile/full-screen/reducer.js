import { ReducerRegistry } from '../../base/redux';

import { _SET_IMMERSIVE_LISTENER } from './actionTypes';

const INITIAL_STATE = {
    listener: undefined
};

ReducerRegistry.register(
    'features/full-screen',
    (state = INITIAL_STATE, action) => {
        switch (action.type) {
        case _SET_IMMERSIVE_LISTENER:
            return {
                ...state,
                listener: action.listener
            };
        }

        return state;
    });
