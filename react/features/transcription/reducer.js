import { ReducerRegistry } from '../base/redux';
import { TRANSCRIPTION_STATE_UPDATED } from './actionTypes';

/**
 * Reduces the Redux actions of the feature features/transcription.
 */
ReducerRegistry.register('features/transcription', (state = {}, action) => {
    switch (action.type) {
    case TRANSCRIPTION_STATE_UPDATED:
        return {
            ...state,
            transcriptionState: action.transcriptionState
        };

    default:
        return state;
    }
});
