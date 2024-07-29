import PersistenceRegistry from '../base/redux/PersistenceRegistry';
import ReducerRegistry from '../base/redux/ReducerRegistry';
import { IPoll } from '../polls/types';

import { REMOVE_POLL_FROM_HISTORY, SAVE_POLL_IN_HISTORY } from './actionTypes';

const INITIAL_STATE = {
    polls: {}
};

export interface IPollsHistoryState {
    polls: {
        [meetingId: string]: {
            [pollId: string]: IPoll;
        };
    };
}

const STORE_NAME = 'features/polls-history';

PersistenceRegistry.register(STORE_NAME, INITIAL_STATE);

ReducerRegistry.register<IPollsHistoryState>(STORE_NAME, (state = INITIAL_STATE, action): IPollsHistoryState => {
    switch (action.type) {

    case REMOVE_POLL_FROM_HISTORY: {
        if (Object.keys(state.polls[action.meetingId] ?? {})?.length === 1) {
            delete state.polls[action.meetingId];
        } else {
            delete state.polls[action.meetingId]?.[action.pollId];
        }

        return state;
    }

    case SAVE_POLL_IN_HISTORY: {
        return {
            ...state,
            polls: {
                ...state.polls,
                [action.meetingId]: {
                    ...state.polls[action.meetingId],
                    [action.pollId]: action.poll
                }
            }
        };
    }

    default:
        return state;
    }
});
