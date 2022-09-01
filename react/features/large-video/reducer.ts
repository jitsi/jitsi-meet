import { PARTICIPANT_ID_CHANGED } from '../base/participants/actionTypes';
import ReducerRegistry from '../base/redux/ReducerRegistry';

import {
    SELECT_LARGE_VIDEO_PARTICIPANT,
    SET_LARGE_VIDEO_DIMENSIONS,
    UPDATE_KNOWN_LARGE_VIDEO_RESOLUTION,
    UPDATE_LAST_LARGE_VIDEO_MEDIA_EVENT,
    SET_SEE_WHAT_IS_BEING_SHARED
} from './actionTypes';

export interface ILargeVideoState {
    lastMediaEvent?: string;
    participantId?: string;
    resolution?: number;
    seeWhatIsBeingShared?: boolean;
}

ReducerRegistry.register('features/large-video', (state: ILargeVideoState = {}, action) => {
    switch (action.type) {

    // When conference is joined, we update ID of local participant from default
    // 'local' to real ID. However, in large video we might have already
    // selected 'local' as participant on stage. So in this case we must update
    // ID of participant on stage to match ID in 'participants' state to avoid
    // additional changes in state and (re)renders.
    case PARTICIPANT_ID_CHANGED:
        if (state.participantId === action.oldValue) {
            return {
                ...state,
                participantId: action.newValue
            };
        }
        break;

    case SELECT_LARGE_VIDEO_PARTICIPANT:
        return {
            ...state,
            participantId: action.participantId
        };

    case SET_LARGE_VIDEO_DIMENSIONS:
        return {
            ...state,
            height: action.height,
            width: action.width
        };

    case UPDATE_KNOWN_LARGE_VIDEO_RESOLUTION:
        return {
            ...state,
            resolution: action.resolution
        };

    case UPDATE_LAST_LARGE_VIDEO_MEDIA_EVENT:
        return {
            ...state,
            lastMediaEvent: action.name
        };

    case SET_SEE_WHAT_IS_BEING_SHARED:
        return {
            ...state,
            seeWhatIsBeingShared: action.seeWhatIsBeingShared
        };

    }

    return state;
});
