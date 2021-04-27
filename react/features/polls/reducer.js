// @flow

import { ReducerRegistry } from '../base/redux';

import { RECEIVE_POLL, RECEIVE_ANSWER } from './actionTypes';

const INITIAL_STATE = {
    polls: {},
    current_poll_id: null
};

ReducerRegistry.register('features/polls', (state = INITIAL_STATE, action) => {
    switch(action.type) {
    case RECEIVE_POLL:
        console.log('Received poll #' + action.pollId + ':', action.poll);
        return {
            ...state,
            current_poll_id: action.pollId,
            polls: {
                ...state.polls,
                [action.pollId]: action.poll
            }
        };
    
        case RECEIVE_ANSWER:
            console.log('Reducer Received answer for poll' + action.pollId + ":" + action.answer);
            // TODO add here logic to add answer to existing poll
            return {
                ...state,
                polls : {
                    ...state.polls
                }
            }

    default:
        return state;
    }
});