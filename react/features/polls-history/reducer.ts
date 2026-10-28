import PersistenceRegistry from '../base/redux/PersistenceRegistry';
import ReducerRegistry from '../base/redux/ReducerRegistry';
import { IPollData } from '../polls/types';

import { REMOVE_POLL_FROM_HISTORY, SAVE_POLL_IN_HISTORY } from './actionTypes';

const INITIAL_STATE = {
    polls: {}
};

export interface IPollsHistoryState {
    polls: {
        [meetingId: string]: {
            [pollId: string]: IPollData;
        };
    };
}

const STORE_NAME = 'features/polls-history';

PersistenceRegistry.register(STORE_NAME, INITIAL_STATE);

ReducerRegistry.register<IPollsHistoryState>(STORE_NAME, (state = INITIAL_STATE, action): IPollsHistoryState => {
    switch (action.type) {

    case REMOVE_POLL_FROM_HISTORY: {
        const meetingPolls = state.polls[action.meetingId];

        if (!meetingPolls || !action.pollId || !(action.pollId in meetingPolls)) {
            return state;
        }

        if (Object.keys(meetingPolls).length <= 1) {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { [action.meetingId]: _removedMeeting, ...newPolls } = state.polls;

            return {
                ...state,
                polls: newPolls
            };
        }

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { [action.pollId]: _removedPoll, ...newMeetingPolls } = meetingPolls;

        return {
            ...state,
            polls: {
                ...state.polls,
                [action.meetingId]: newMeetingPolls
            }
        };
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
