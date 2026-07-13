import ReducerRegistry from '../base/redux/ReducerRegistry';

import {
    CLEAR_AUDIO_TRANSLATION,
    SET_AUDIO_TRANSLATION_LANGUAGE,
    SET_PARTICIPANT_AUDIO_TRANSLATION_LANGUAGE
} from './actionTypes';

/**
 * The redux state of the audio-translation feature.
 */
export interface IAudioTranslationState {

    /**
     * The default target language remote audio is translated into, or null when off.
     */
    language: string | null;

    /**
     * Per-participant target-language overrides (participantId -> language, or null to disable for that
     * participant). An entry present here takes precedence over {@link language}; an absent entry inherits it.
     */
    participantLanguages: { [participantId: string]: string | null; };
}

const DEFAULT_STATE: IAudioTranslationState = {
    language: null,
    participantLanguages: {}
};

ReducerRegistry.register<IAudioTranslationState>(
    'features/audio-translation',
    (state = DEFAULT_STATE, action): IAudioTranslationState => {
        switch (action.type) {
        case CLEAR_AUDIO_TRANSLATION:
            return DEFAULT_STATE;
        case SET_AUDIO_TRANSLATION_LANGUAGE:
            return {
                ...state,
                language: action.language
            };
        case SET_PARTICIPANT_AUDIO_TRANSLATION_LANGUAGE:
            return {
                ...state,
                participantLanguages: {
                    ...state.participantLanguages,
                    [action.participantId]: action.language
                }
            };
        default:
            return state;
        }
    });
