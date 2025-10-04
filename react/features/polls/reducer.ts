import ReducerRegistry from '../base/redux/ReducerRegistry';

import {
    CHANGE_VOTE,
    CLEAR_POLLS,
    EDIT_POLL,
    RECEIVE_ANSWER,
    RECEIVE_POLL,
    REGISTER_VOTE,
    REMOVE_POLL,
    RESET_UNREAD_POLLS_COUNT,
    SAVE_POLL
} from './actionTypes';
import { IIncomingAnswerData, IPollData } from './types';

const INITIAL_STATE = {
    polls: {},

    // Number of not read message
    unreadPollsCount: 0
};

export interface IPollsState {
    polls: {
        [pollId: string]: IPollData;
    };
    unreadPollsCount: number;
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
                [action.poll.pollId]: action.poll
            },
            unreadPollsCount: state.unreadPollsCount + 1
        };
    }

    case SAVE_POLL: {
        return {
            ...state,
            polls: {
                ...state.polls,
                [action.poll.pollId]: action.poll
            }
        };
    }

    // Reducer triggered when an answer is received
    // The answer is added  to an existing poll
    case RECEIVE_ANSWER: {

        const { answer }: { answer: IIncomingAnswerData; } = action;
        const pollId = answer.pollId;
        const poll = state.polls[pollId];

        // if the poll doesn't exist
        if (!(pollId in state.polls)) {
            console.warn('requested poll does not exist: pollId ', pollId);

            return state;
        }

        // if the poll exists, we update it with the incoming answer
        for (let i = 0; i < poll.answers.length; i++) {
            // if the answer was chosen, we add the senderId to the array of voters of this answer
            let voters = poll.answers[i].voters || [];

            if (voters.find(user => user.id === answer.senderId)) {
                if (!answer.answers[i]) {
                    voters = voters.filter(user => user.id !== answer.senderId);
                }
            } else if (answer.answers[i]) {
                voters.push({
                    id: answer.senderId,
                    name: answer.voterName
                });
            }

            poll.answers[i].voters = voters?.length ? voters : undefined;
        }

        // finally we update the state by returning the updated poll
        return {
            ...state,
            polls: {
                ...state.polls,
                [pollId]: {
                    ...poll,
                    answers: [ ...poll.answers ]
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

    case RESET_UNREAD_POLLS_COUNT: {
        return {
            ...state,
            unreadPollsCount: 0
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
        const { [action.poll.pollId]: _removedPoll, ...newState } = state.polls;

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
