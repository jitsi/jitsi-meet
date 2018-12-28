// @flow

import { ReducerRegistry } from '../../base/redux';

import { _SET_IMMERSIVE_LISTENER } from './actionTypes';

ReducerRegistry.register('features/full-screen', (state = {}, action) => {
    switch (action.type) {
    case _SET_IMMERSIVE_LISTENER:
        return {
            ...state,
            listener: action.listener
        };
    }

    return state;
});
