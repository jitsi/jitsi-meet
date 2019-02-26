// @flow

import { ReducerRegistry } from '../base/redux';
import {
    POLL_ENDED,
    POLL_STARTED,
    POLL_VOTED
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
    case POLL_ENDED: {
        return {
            ...state,
            currentPoll: null
        };
    }
    case POLL_STARTED: {
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
    case POLL_VOTED: {
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
