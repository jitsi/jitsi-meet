import { CONFERENCE_JOINED } from '../base/conference/actionTypes';
import MiddlewareRegistry from '../base/redux/MiddlewareRegistry';
import { REMOVE_POLL, SAVE_POLL } from '../polls/actionTypes';
import { savePoll } from '../polls/actions';

import { removePollFromHistory, savePollInHistory } from './actions';

MiddlewareRegistry.register(({ dispatch, getState }) => next => action => {
    const result = next(action);
    const { room: meetingId } = getState()['features/base/conference'];

    switch (action.type) {

    case CONFERENCE_JOINED: {
        const state = getState();
        const pollsHistory = meetingId && state['features/polls-history'].polls?.[meetingId];

        if (!pollsHistory) {
            return null;
        }

        for (const key in pollsHistory) {
            if (pollsHistory.hasOwnProperty(key) && pollsHistory[key].saved) {
                dispatch(savePoll(pollsHistory[key]));
            }
        }
        break;
    }

    case REMOVE_POLL: {
        const { poll } = action;
        const pollId = poll?.pollId ?? action.pollId;

        if (meetingId && pollId) {
            dispatch(removePollFromHistory(meetingId, pollId, poll));
        }
        break;
    }

    case SAVE_POLL: {
        const { poll } = action;
        const pollId = poll?.pollId ?? action.pollId;

        if (meetingId && pollId) {
            dispatch(savePollInHistory(meetingId, pollId, poll));
        }
        break;
    }
    }

    return result;
});
