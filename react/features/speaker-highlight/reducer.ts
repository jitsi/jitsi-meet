import ReducerRegistry from '../base/redux/ReducerRegistry';

import { SET_SPEAKER_HIGHLIGHT_ENABLED, TOGGLE_SPEAKER_HIGHLIGHT } from './actionTypes';

/**
 * The initial state of the feature speaker-highlight.
 */
const INITIAL_STATE = {
    enabled: true
};

export interface ISpeakerHighlightState {
    enabled: boolean;
}

/**
 * Listen for actions that contain the speaker highlighting state that should be
 * set and update the state.
 */
ReducerRegistry.register<ISpeakerHighlightState>('features/speaker-highlight', (state = INITIAL_STATE, action): ISpeakerHighlightState => {
    switch (action.type) {
    case SET_SPEAKER_HIGHLIGHT_ENABLED:
        return {
            ...state,
            enabled: action.enabled
        };

    case TOGGLE_SPEAKER_HIGHLIGHT:
        return {
            ...state,
            enabled: !state.enabled
        };

    default:
        return state;
    }
}); 