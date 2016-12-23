import {
    CONFERENCE_FAILED,
    CONFERENCE_JOINED,
    CONFERENCE_LEFT
} from '../base/conference';
import { ReducerRegistry, setStateProperty } from '../base/redux';

import { BEGIN_ROOM_LOCK_REQUEST, END_ROOM_LOCK_REQUEST } from './actionTypes';

ReducerRegistry.register('features/room-lock', (state = {}, action) => {
    switch (action.type) {
    case BEGIN_ROOM_LOCK_REQUEST:
        return setStateProperty(state, 'requested', action.conference);

    case CONFERENCE_FAILED:
    case CONFERENCE_LEFT:
    case END_ROOM_LOCK_REQUEST: {
        if (state.requested === action.conference) {
            return setStateProperty(state, 'requested', undefined);
        }
        break;
    }

    case CONFERENCE_JOINED: {
        if (state.requested !== action.conference) {
            return setStateProperty(state, 'requested', undefined);
        }
        break;
    }
    }

    return state;
});
