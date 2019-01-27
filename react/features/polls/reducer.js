// @flow

import { ReducerRegistry } from '../base/redux';
import {
    POLL_SESSION_STARTED,
    POLL_SESSION_VOTE,
    POLL_SESSION_FINISHED
} from './actionTypes';

const DEFAULT_STATE = {

    /**
     * All Polls choices stored by ID.
     */
    choices: {},

    /**
     * Current Poll ID: ?string
     */
    currentPoll: null,

    /**
     * All Polls Objects stored by ID.
     */
    polls: {},

    /**
     * All Polls questions stored by ID.
     */
    questions: {}
};

ReducerRegistry.register('features/polls', (state = DEFAULT_STATE, action) => {
    switch (action.type) {
    case POLL_SESSION_FINISHED: {
        return {
            ...state,
            currentPoll: null
        };
    }
    case POLL_SESSION_STARTED: {
        const { poll, question, choices } = action;

        return {
            ...state,
            currentPoll: poll.id,
            polls: {
                ...state.polls,
                [poll.id]: poll
            },
            questions: {
                ...state.questions,
                [question.id]: question
            },
            choices: {
                ...state.choices,
                ...choices
            }
        };
    }
    case POLL_SESSION_VOTE: {
        const { choice } = action;

        return {
            ...state,
            choices: {
                ...state.choices,
                [choice.id]: {
                    choice
                }
            }
        };
    }
    }

    return state;
});
