import { PARTICIPANT_ID_CHANGED } from '../base/participants';
import { ReducerRegistry } from '../base/redux';

import { SELECT_LARGE_VIDEO_PARTICIPANT } from './actionTypes';

ReducerRegistry.register('features/large-video', (state = {}, action) => {
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
    }

    return state;
});
