// @flow

import { ReducerRegistry } from '../base/redux';
import {
    POLL_SESSION_INITIATED,
    POLL_SESSION_STARTED
} from './actionTypes';

/**
 * Poll Feature default state.
 * isPollRunning: boolean,
 * polls: Array<Object>
 */
const DEFAULT_STATE = {

    /**
     * Indicates if a poll session is currently running.
     */
    isPollRunning: false,

    /**
     * Record of poll sessions. Current poll session is last item
     * in array.
     */
    polls: []
};

ReducerRegistry.register('features/polls', (state = DEFAULT_STATE, action) => {
    switch (action.type) {
    case POLL_SESSION_INITIATED: {
        // Action recieved by the participant who created the poll.
        const { poll } = action;

        return {
            ...state,
            isPollRunning: true,
            polls: [
                ...state.polls,
                poll
            ]
        };
    }
    case POLL_SESSION_STARTED: {
        // Action recieved by other participants in the conference,
        // the poll session is sent in the action.
        const { poll } = action;

        return {
            ...state,
            isPollRunning: true,
            polls: [
                ...state.polls,
                poll
            ]
        };
    }
    }

    return state;
});
