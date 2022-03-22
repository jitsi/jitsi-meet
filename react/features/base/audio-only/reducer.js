// @flow

import { ReducerRegistry } from '../redux';

import { SET_AUDIO_ONLY } from './actionTypes';


const DEFAULT_STATE = {
    enabled: false
};


ReducerRegistry.register('features/base/audio-only', (state = DEFAULT_STATE, action) => {
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
