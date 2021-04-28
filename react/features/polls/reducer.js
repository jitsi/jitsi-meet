// @flow

import { ReducerRegistry } from '../base/redux';

import { RECEIVE_POLL, RECEIVE_ANSWER } from './actionTypes';
import type { Poll, Answer } from './types';

const INITIAL_STATE = {
    polls: {}
};

ReducerRegistry.register('features/polls', (state = INITIAL_STATE, action) => {
    switch (action.type) {
    case RECEIVE_POLL:
        console.log('Received poll', action.pollId, ' :', action.poll);

        return {
            ...state,
            polls: {
                ...state.polls,
                [action.pollId]: action.poll
            }
        };

    // Here is the logic to add answer to an existing poll
    case RECEIVE_ANSWER: {

        const { pollId, answer }: { pollId: string; answer: Answer } = action;

        console.log('currently saved polls: ', state.polls);
        console.log('Reducer Received answer for poll :', pollId, answer);


        // if the poll doesn't exist
        if (!(pollId in state.polls)) {
            console.warn('requested poll does not exist: pollId ', pollId);

            return state;
        }

        // if the poll exists, we will update it with the incoming answer
        const updatedPoll: Poll = state.polls[pollId];

        for (let i = 0; i < updatedPoll.answers.length; i++) {
            if (answer.answers[i] === true) {
                updatedPoll.answers[i].voters.add(answer.senderId);
            }
        }
        console.log('updated poll', updatedPoll);

        // finally we update the state by returning the updated poll
        return {
            ...state,
            polls: {
                ...state.polls,
                [pollId]: updatedPoll
            }
        };
    }


    default:
        return state;
    }
});
