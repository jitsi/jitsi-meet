import ReducerRegistry from '../base/redux/ReducerRegistry';

import { UPDATE_LOCAL_TRACKS_DURATION } from './actionTypes';

/**
 * Initial state.
 */
const DEFAULT_STATE = {
    localTracksDuration: {
        audio: {
            startedTime: -1,
            value: 0
        },
        video: {
            camera: {
                startedTime: -1,
                value: 0
            },
            desktop: {
                startedTime: -1,
                value: 0
            }
        },
        conference: {
            startedTime: -1,
            value: 0
        }
    }
};

interface IValue {
    startedTime: number;
    value: number;
}

export interface IAnalyticsState {
    localTracksDuration: {
        audio: IValue;
        conference: IValue;
        video: {
            camera: IValue;
            desktop: IValue;
        };
    };
}

/**
 * Listen for actions which changes the state of the analytics feature.
 *
 * @param {Object} state - The Redux state of the feature features/analytics.
 * @param {Object} action - Action object.
 * @param {string} action.type - Type of action.
 * @returns {Object}
 */
ReducerRegistry.register<IAnalyticsState>('features/analytics',
(state = DEFAULT_STATE, action): IAnalyticsState => {
    switch (action.type) {
    case UPDATE_LOCAL_TRACKS_DURATION:
        return {
            ...state,
            localTracksDuration: action.localTracksDuration
        };
    default:
        return state;
    }
});
