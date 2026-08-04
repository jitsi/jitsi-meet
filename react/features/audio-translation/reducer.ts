import ReducerRegistry from '../base/redux/ReducerRegistry';

import {
    CLEAR_AUDIO_TRANSLATION,
    CLEAR_RECEIVING_TRANSLATED_SOURCES,
    SET_AUDIO_TRANSLATION_LANGUAGE,
    SET_PARTICIPANT_AUDIO_TRANSLATION_LANGUAGE,
    SET_TRANSLATION_LISTENERS,
    UPDATE_TRANSLATED_SOURCE_SENDING
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

    /**
     * Translated source names the bridge is currently forwarding to us (i.e. we are hearing them translated).
     * A source follows the {@code <endpointId>-a<idx>.<lang>} convention; membership is last-write-wins.
     */
    receivingSources: string[];

    /**
     * Endpoint ids of the remote participants currently translating the local participant's audio, pushed by
     * the audio-translation component. Drives the per-participant "translation enabled" badge.
     */
    translationListeners: string[];
}

const DEFAULT_STATE: IAudioTranslationState = {
    language: null,
    participantLanguages: {},
    receivingSources: [],
    translationListeners: []
};

ReducerRegistry.register<IAudioTranslationState>(
    'features/audio-translation',
    (state = DEFAULT_STATE, action): IAudioTranslationState => {
        switch (action.type) {
        case CLEAR_AUDIO_TRANSLATION:
            return DEFAULT_STATE;
        case CLEAR_RECEIVING_TRANSLATED_SOURCES:
            return {
                ...state,
                receivingSources: []
            };
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
        case SET_TRANSLATION_LISTENERS:
            return {
                ...state,
                translationListeners: action.ids
            };
        case UPDATE_TRANSLATED_SOURCE_SENDING: {
            const has = state.receivingSources.includes(action.sourceName);

            if (action.sending === has) {
                return state;
            }

            return {
                ...state,
                receivingSources: action.sending
                    ? [ ...state.receivingSources, action.sourceName ]
                    : state.receivingSources.filter((source: string) => source !== action.sourceName)
            };
        }
        default:
            return state;
        }
    });
