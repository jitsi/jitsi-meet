import { ReducerRegistry } from '../base/redux';
import {
    HIDE_RECORDING_LABEL,
    RECORDING_STATE_UPDATED,
    SET_RECORDING_TYPE
} from './actionTypes';

/**
 * Reduces the Redux actions of the feature features/recording.
 */
ReducerRegistry.register('features/recording', (state = {}, action) => {
    switch (action.type) {
    case HIDE_RECORDING_LABEL:
        return {
            ...state,
            labelDisplayConfiguration: null
        };

    case RECORDING_STATE_UPDATED:
        return {
            ...state,
            ...action.recordingState
        };

    case SET_RECORDING_TYPE:
        return {
            ...state,
            recordingType: action.recordingType
        };

    default:
        return state;
    }
});
