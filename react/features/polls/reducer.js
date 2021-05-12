// @flow

import { ReducerRegistry } from '../base/redux';

import { RECEIVE_POLL, RECEIVE_ANSWER, SHOW_POLL } from './actionTypes';
import type { Answer } from './types';

const INITIAL_STATE = {
    polls: {},
    pollQueue: []
};

ReducerRegistry.register('features/polls', (state = INITIAL_STATE, action) => {
    switch (action.type) {

    // Reducer triggered when a poll is received
    case RECEIVE_POLL: {
        const newState = {
            ...state,
            polls: {
                ...state.polls,

                // The poll is added to the dictionnary of received polls
                [action.pollId]: action.poll
            }
        };

        if (action.queue) {
            newState.pollQueue = [ ...newState.pollQueue, action.pollId ];
        }

        return newState;
    }

    // Reducer triggered when a poll should be shown
    case SHOW_POLL: {
        // Remove poll from queue if present
        const index = state.pollQueue.indexOf(action.pollId);

        if (index !== -1) {
            const newQueue = [ ...state.pollQueue ];

            newQueue.splice(index, 1);

            return {
                ...state,
                pollQueue: newQueue
            };
        }

        return state;

    }

    // Reducer triggered when an answer is received
    // The answer is added  to an existing poll
    case RECEIVE_ANSWER: {

        const { pollId, answer }: { pollId: string; answer: Answer } = action;

        // if the poll doesn't exist
        if (!(pollId in state.polls)) {
            console.warn('requested poll does not exist: pollId ', pollId);

            return state;
        }

        // if the poll exists, we update it with the incoming answer
        const newAnswers = state.polls[pollId].answers
            .map(_answer => {
                return {
                    name: _answer.name,
                    voters: new Map(_answer.voters)
                };
            });

        for (let i = 0; i < newAnswers.length; i++) {
            // if the answer was chosen, we add the sender to the set of voters of this answer
            if (answer.answers[i] === true) {
                newAnswers[i].voters.set(answer.senderId, answer.voterName);
            }
        }

        // finally we update the state by returning the updated poll
        return {
            ...state,
            polls: {
                ...state.polls,
                [pollId]: {
                    ...state.polls[pollId],
                    answers: newAnswers
                }
            }
        };
    }


    default:
        return state;
    }
});
