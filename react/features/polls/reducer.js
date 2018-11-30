// @flow

import { ReducerRegistry } from '../base/redux';
import {
    POLL_SESSION_INITIATED,
    POLL_SESSION_STARTED,
    POLL_SESSION_VOTE,
    POLL_SESSION_VOTE_RECIEVED,
    POLL_SESSION_END,
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
     * Current User vote ID: ?string
     */
    currentVote: null,

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
    case POLL_SESSION_INITIATED:
    case POLL_SESSION_STARTED: {
        const { payload } = action;
        const { poll, question, choices } = payload;

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
        const { id } = action;
        const newState = _updateUserVote(state, action);

        return {
            ...newState,
            currentVote: id
        };
    }
    case POLL_SESSION_VOTE_RECIEVED: {
        const newState = _updateUserVote(state, action);

        return {
            ...newState
        };
    }
    case POLL_SESSION_END:
    case POLL_SESSION_FINISHED: {
        return {
            ...state,
            currentPoll: null,
            currentVote: null
        };
    }
    }

    return state;
});

/**
 * Update a user vote.
 *
 * @param {Object} state - Redux state.
 * @param {Object} action - Redux Action.
 * @returns {{}}
 */
function _updateUserVote(state: Object, action: Object) {
    const { prevID, id, user } = action;
    const choice = state.choices[id];
    const prevChoice = prevID === null ? null : { ...state.choices[prevID] };
    let updatedChoices = {
        [choice.id]: {
            ...choice,
            votes: choice.votes.concat(user)
        }
    };

    if (prevChoice) {
        prevChoice.votes = prevChoice.votes.filter(x => x !== user);

        updatedChoices = {
            ...updatedChoices,
            [prevChoice.id]: {
                ...prevChoice
            }
        };
    }

    return {
        ...state,
        choices: {
            ...state.choices,
            ...updatedChoices
        }
    };
}
