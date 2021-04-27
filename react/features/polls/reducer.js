// @flow

import { ReducerRegistry } from '../base/redux';

import { RECEIVE_POLL } from './actionTypes';

const INITIAL_STATE = {
    polls: {},
};

ReducerRegistry.register('features/polls', (state = INITIAL_STATE, action) => {
    switch(action.type) {
    case RECEIVE_POLL:
        console.log('Received poll #' + action.id + ':', action.poll);
        return { ...state,
            polls: { ...state.polls,
                [action.id]: action.poll
            }
        };
    default:
        return state;
    }
});