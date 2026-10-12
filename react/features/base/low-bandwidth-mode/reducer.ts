import ReducerRegistry from '../redux/ReducerRegistry';

import { SET_LOW_BANDWIDTH_MODE } from './actionTypes';

export interface ILowBandwidthModeState {
    enabled: boolean;
}

const DEFAULT_STATE = {
    enabled: false
};


ReducerRegistry.register<ILowBandwidthModeState>('features/base/low-bandwidth-mode',
(state = DEFAULT_STATE, action): ILowBandwidthModeState => {
    switch (action.type) {
    case SET_LOW_BANDWIDTH_MODE:
        return {
            ...state,
            enabled: action.lowBandwidthMode
        };
    default:
        return state;
    }
});
