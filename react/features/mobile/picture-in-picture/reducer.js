// @flow

import { ReducerRegistry } from '../../base/redux';

import { _SET_EMITTER_SUBSCRIPTIONS } from './actionTypes';

ReducerRegistry.register('features/pip', (state = {}, action) => {
    switch (action.type) {
    case _SET_EMITTER_SUBSCRIPTIONS:
        return {
            ...state,
            emitterSubscriptions: action.emitterSubscriptions
        };
    }

    return state;
});
