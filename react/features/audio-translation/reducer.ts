import ReducerRegistry from '../base/redux/ReducerRegistry';

import { SET_AUDIO_TRANSLATION_LANGUAGE } from './actionTypes';

/**
 * The redux state of the audio-translation feature.
 */
export interface IAudioTranslationState {

    /**
     * The target language remote audio is translated into, or null when off.
     */
    language: string | null;
}

const DEFAULT_STATE: IAudioTranslationState = {
    language: null
};

ReducerRegistry.register<IAudioTranslationState>(
    'features/audio-translation',
    (state = DEFAULT_STATE, action): IAudioTranslationState => {
        switch (action.type) {
        case SET_AUDIO_TRANSLATION_LANGUAGE:
            return {
                ...state,
                language: action.language
            };
        default:
            return state;
        }
    });
