// @flow

import { ReducerRegistry } from '../base/redux';

import {
    CHANGE_VOTE,
    CLEAR_POLLS,
    RECEIVE_POLL,
    RECEIVE_ANSWER,
    REGISTER_VOTE,
    RETRACT_VOTE,
    RESET_NB_UNREAD_POLLS
} from './actionTypes';
import type { Answer } from './types';

const INITIAL_STATE = {
    polls: {},

    // Number of not read message
    nbUnreadPolls: 0
};

ReducerRegistry.register('features/polls', (state = INITIAL_STATE, action) => {
    switch (action.type) {

    case CHANGE_VOTE: {
        const { pollId, value } = action;

        return {
            ...state,
            polls: {
                ...state.polls,
                [pollId]: {
                    ...state.polls[pollId],
                    changingVote: value,
                    showResults: !value
                }
            }
        };
    }

    case CLEAR_POLLS: {
        return {
            ...state,
            ...INITIAL_STATE
        };
    }

    // Reducer triggered when a poll is received
    case RECEIVE_POLL: {
        const newState = {
            ...state,
            polls: {
                ...state.polls,

                // The poll is added to the dictionnary of received polls
                [action.pollId]: action.poll
            },
            nbUnreadPolls: state.nbUnreadPolls + 1
        };

        return newState;
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
            const voters = newAnswers[i].voters;

            if (answer.answers[i]) {
                voters.set(answer.voterId, answer.voterName);

            } else {
                voters.delete(answer.voterId);
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

    case REGISTER_VOTE: {
        const { answers, pollId }: { answers: Array<boolean> | null; pollId: string } = action;

        return {
            ...state,
            polls: {
                ...state.polls,
                [pollId]: {
                    ...state.polls[pollId],
                    changingVote: false,
                    lastVote: answers,
                    showResults: true
                }
            }
        };
    }

    case RETRACT_VOTE: {
        const { pollId }: { pollId: string } = action;

        return {
            ...state,
            polls: {
                ...state.polls,
                [pollId]: {
                    ...state.polls[pollId],
                    showResults: false
                }
            }
        };
    }

    case RESET_NB_UNREAD_POLLS: {
        return {
            ...state,
            nbUnreadPolls: 0
        };
    }

    default:
        return state;
    }
});
