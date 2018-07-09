/* @flow */

import { ReducerRegistry } from '../base/redux';
import {
    LOCAL_RECORDING_ENGAGED,
    LOCAL_RECORDING_STATS_UPDATE,
    LOCAL_RECORDING_TOGGLE_DIALOG,
    LOCAL_RECORDING_UNENGAGED
} from './actionTypes';
import { recordingController } from './controller';

ReducerRegistry.register('features/local-recording', (state = {}, action) => {
    switch (action.type) {
    case LOCAL_RECORDING_ENGAGED: {
        return {
            ...state,
            isEngaged: true,
            recordingStartedAt: new Date(Date.now()),
            encodingFormat: recordingController._format
        };
    }
    case LOCAL_RECORDING_UNENGAGED:
        return {
            ...state,
            isEngaged: false,
            recordingStartedAt: null
        };
    case LOCAL_RECORDING_TOGGLE_DIALOG:
        return {
            ...state,
            showDialog: state.showDialog === undefined
                || state.showDialog === false
        };
    case LOCAL_RECORDING_STATS_UPDATE:
        return {
            ...state,
            stats: action.stats
        };
    default:
        return state;
    }
});
