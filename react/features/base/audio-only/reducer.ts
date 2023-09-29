import ReducerRegistry from '../redux/ReducerRegistry';

import { SET_AUDIO_ONLY } from './actionTypes';

export interface IAudioOnlyState {
    enabled: boolean;
}

const DEFAULT_STATE = {
    enabled: false
};


ReducerRegistry.register<IAudioOnlyState>('features/base/audio-only',
(state = DEFAULT_STATE, action): IAudioOnlyState => {
    switch (action.type) {
    case SET_AUDIO_ONLY:
        return {
            ...state,
            enabled: action.audioOnly
        };
    default:
        return state;
    }
});
