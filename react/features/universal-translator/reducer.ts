import ReducerRegistry from '../base/redux/ReducerRegistry';
import PersistenceRegistry from '../base/redux/PersistenceRegistry';

import {
    CLEAR_TRANSLATION_ERROR,
    DISABLE_UNIVERSAL_TRANSLATOR_EFFECT,
    ENABLE_UNIVERSAL_TRANSLATOR_EFFECT,
    INIT_UNIVERSAL_TRANSLATOR,
    SET_API_KEYS,
    SET_SOURCE_LANGUAGE,
    SET_STT_PROVIDER,
    SET_TARGET_LANGUAGE,
    SET_TRANSCRIPTION_RESULT,
    SET_TRANSLATION_ERROR,
    SET_TRANSLATION_PROVIDER,
    SET_TRANSLATION_RESULT,
    SET_TTS_PROVIDER,
    START_TRANSLATION_RECORDING,
    STOP_TRANSLATION_RECORDING,
    TOGGLE_UNIVERSAL_TRANSLATOR,
    UPDATE_LATENCY_METRICS,
    UPDATE_PROCESSING_STEP,
    UPDATE_TRANSLATION_STATUS
} from './actionTypes';

/**
 * Initial state for the universal translator feature.
 */
const DEFAULT_STATE = {
    isInitialized: false,
    isRecording: false,
    showDialog: false,
    status: 'idle',
    currentStep: null,
    sttProvider: 'deepgram',
    ttsProvider: 'cartesia',
    translationProvider: 'openai',
    sourceLanguage: 'en',
    targetLanguage: 'es',
    transcriptionResult: null,
    translationResult: null,
    latencyMetrics: {
        stt: { averageLatency: 0, lastLatency: 0, requestCount: 0 },
        translation: { averageLatency: 0, lastLatency: 0, requestCount: 0 },
        tts: { averageLatency: 0, lastLatency: 0, requestCount: 0 }
    },
    error: null,
    apiKeys: {
        openai: '',
        groq: '',
        deepgram: '',
        assemblyai: '',
        cartesia: '',
        elevenlabs: '',
        azure: '',
        google: '',
        microsoft: ''
    },
    config: null,
    effectEnabled: false
};

export interface IUniversalTranslatorState {
    apiKeys: {
        assemblyai: string;
        azure: string;
        cartesia: string;
        deepgram: string;
        elevenlabs: string;
        google: string;
        groq: string;
        microsoft: string;
        openai: string;
    };
    config: any;
    currentStep: string | null;
    effectEnabled: boolean;
    error: string | null;
    isInitialized: boolean;
    isRecording: boolean;
    latencyMetrics: {
        stt: { averageLatency: number; lastLatency: number; requestCount: number; };
        translation: { averageLatency: number; lastLatency: number; requestCount: number; };
        tts: { averageLatency: number; lastLatency: number; requestCount: number; };
    };
    showDialog: boolean;
    sourceLanguage: string;
    status: string;
    sttProvider: string;
    targetLanguage: string;
    transcriptionResult: any;
    translationProvider: string;
    translationResult: any;
    ttsProvider: string;
}

/**
 * Reduces redux actions for the universal translator feature.
 *
 * @param {Object} state - The current state.
 * @param {Object} action - The redux action.
 * @returns {Object} The new state after applying the action.
 */
ReducerRegistry.register<IUniversalTranslatorState>('features/universal-translator',
    (state = DEFAULT_STATE, action): IUniversalTranslatorState => {
        switch (action.type) {
        case INIT_UNIVERSAL_TRANSLATOR:
            return {
                ...state,
                isInitialized: true,
                config: action.config
            };

        case SET_STT_PROVIDER:
            return {
                ...state,
                sttProvider: action.provider
            };

        case SET_TTS_PROVIDER:
            return {
                ...state,
                ttsProvider: action.provider
            };

        case SET_TRANSLATION_PROVIDER:
            return {
                ...state,
                translationProvider: action.provider
            };

        case SET_SOURCE_LANGUAGE:
            return {
                ...state,
                sourceLanguage: action.language
            };

        case SET_TARGET_LANGUAGE:
            return {
                ...state,
                targetLanguage: action.language
            };

        case START_TRANSLATION_RECORDING:
            return {
                ...state,
                isRecording: true,
                status: 'recording',
                error: null,
                transcriptionResult: null,
                translationResult: null
            };

        case STOP_TRANSLATION_RECORDING:
            return {
                ...state,
                isRecording: false,
                status: 'processing'
            };

        case UPDATE_TRANSLATION_STATUS:
            return {
                ...state,
                status: action.status
            };

        case UPDATE_PROCESSING_STEP:
            return {
                ...state,
                currentStep: action.step
            };

        case SET_TRANSCRIPTION_RESULT:
            return {
                ...state,
                transcriptionResult: action.result
            };

        case SET_TRANSLATION_RESULT:
            return {
                ...state,
                translationResult: action.result,
                status: 'completed'
            };

        case UPDATE_LATENCY_METRICS:
            return {
                ...state,
                latencyMetrics: {
                    ...state.latencyMetrics,
                    ...action.metrics
                }
            };

        case SET_TRANSLATION_ERROR:
            return {
                ...state,
                error: action.error,
                status: 'error',
                isRecording: false
            };

        case CLEAR_TRANSLATION_ERROR:
            return {
                ...state,
                error: null
            };

        case SET_API_KEYS:
            return {
                ...state,
                apiKeys: {
                    ...state.apiKeys,
                    ...action.keys
                }
            };

        case TOGGLE_UNIVERSAL_TRANSLATOR:
            return {
                ...state,
                showDialog: !state.showDialog
            };

        case ENABLE_UNIVERSAL_TRANSLATOR_EFFECT:
            return {
                ...state,
                effectEnabled: true
            };

        case DISABLE_UNIVERSAL_TRANSLATOR_EFFECT:
            return {
                ...state,
                effectEnabled: false
            };

        default:
            return state;
        }
    });

/**
 * Register for persistence to save API keys and user preferences across sessions.
 * Only persist configuration data, not temporary state like recording status or results.
 */
PersistenceRegistry.register('features/universal-translator', {
    // Persist API keys - the most important for user experience
    apiKeys: true,
    
    // Persist user preferences
    sttProvider: true,
    ttsProvider: true,
    translationProvider: true,
    sourceLanguage: true,
    targetLanguage: true,
    effectEnabled: true,
    
    // Don't persist temporary state
    isInitialized: false,
    isRecording: false,
    showDialog: false,
    status: false,
    currentStep: false,
    transcriptionResult: false,
    translationResult: false,
    latencyMetrics: false,
    error: false,
    config: false
}, DEFAULT_STATE);
