import ReducerRegistry from '../base/redux/ReducerRegistry';

import {
    CHANGE_VOTE,
    CLEAR_POLLS,
    EDIT_POLL,
    RECEIVE_ANSWER,
    RECEIVE_POLL,
    REGISTER_VOTE,
    REMOVE_POLL,
    RESET_NB_UNREAD_POLLS,
    SAVE_POLL
} from './actionTypes';
import { IAnswer, IPoll } from './types';

const INITIAL_STATE = {
    polls: {},

    // Number of not read message
    nbUnreadPolls: 0
};

export interface IPollsState {
    nbUnreadPolls: number;
    polls: {
        [pollId: string]: IPoll;
    };
}

const STORE_NAME = 'features/polls';

ReducerRegistry.register<IPollsState>(STORE_NAME, (state = INITIAL_STATE, action): IPollsState => {
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

    // Reducer triggered when a poll is received or saved.
    case RECEIVE_POLL: {
        return {
            ...state,
            polls: {
                ...state.polls,
                [action.pollId]: action.poll
            },
            nbUnreadPolls: state.nbUnreadPolls + 1
        };
    }

    case SAVE_POLL: {
        return {
            ...state,
            polls: {
                ...state.polls,
                [action.pollId]: action.poll
            }
        };
    }

    // Reducer triggered when an answer is received
    // The answer is added  to an existing poll
    case RECEIVE_ANSWER: {

        const { pollId, answer }: { answer: IAnswer; pollId: string; } = action;

        // if the poll doesn't exist
        if (!(pollId in state.polls)) {
            console.warn('requested poll does not exist: pollId ', pollId);

            return state;
        }

        // if the poll exists, we update it with the incoming answer
        const newAnswers = state.polls[pollId].answers
            .map(_answer => {
                // checking if the voters is an array for supporting old structure model
                const answerVoters = _answer.voters
                    ? _answer.voters.length
                        ? [ ..._answer.voters ] : Object.keys(_answer.voters) : [];

                return {
                    name: _answer.name,
                    voters: answerVoters
                };
            });


        for (let i = 0; i < newAnswers.length; i++) {
            // if the answer was chosen, we add the senderId to the array of voters of this answer
            const voters = newAnswers[i].voters as any;

            const index = voters.indexOf(answer.voterId);

            if (answer.answers[i]) {
                if (index === -1) {
                    voters.push(answer.voterId);
                }
            } else if (index > -1) {
                voters.splice(index, 1);
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
        const { answers, pollId }: { answers: Array<boolean> | null; pollId: string; } = action;

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

    case RESET_NB_UNREAD_POLLS: {
        return {
            ...state,
            nbUnreadPolls: 0
        };
    }

    case EDIT_POLL: {
        return {
            ...state,
            polls: {
                ...state.polls,
                [action.pollId]: {
                    ...state.polls[action.pollId],
                    editing: action.editing
                }
            }
        };
    }

    case REMOVE_POLL: {
        if (Object.keys(state.polls ?? {})?.length === 1) {
            return {
                ...state,
                ...INITIAL_STATE
            };
        }

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { [action.pollId]: _removedPoll, ...newState } = state.polls;

        return {
            ...state,
            polls: {
                ...newState
            }
        };
    }

    default:
        return state;
    }
});
