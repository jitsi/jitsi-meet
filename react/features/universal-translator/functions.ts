import { IReduxState } from '../app/types';

import { IUniversalTranslatorState } from './reducer';

/**
 * Gets the universal translator state from Redux store.
 *
 * @param {Object} state - The Redux state.
 * @returns {Object} The universal translator state.
 */
export function getUniversalTranslatorState(state: IReduxState): IUniversalTranslatorState {
    return state['features/universal-translator'];
}

/**
 * Checks if the universal translator is available/enabled.
 *
 * @param {Object} state - The Redux state.
 * @returns {boolean} True if universal translator is available.
 */
export function isUniversalTranslatorAvailable(state: IReduxState): boolean {
    const translatorState = getUniversalTranslatorState(state);
    
    return Boolean(translatorState?.isInitialized);
}

/**
 * Checks if universal translator is currently recording.
 *
 * @param {Object} state - The Redux state.
 * @returns {boolean} True if recording is active.
 */
export function isUniversalTranslatorRecording(state: IReduxState): boolean {
    const translatorState = getUniversalTranslatorState(state);
    
    return Boolean(translatorState?.isRecording);
}

/**
 * Gets the current translation status.
 *
 * @param {Object} state - The Redux state.
 * @returns {string} The current status.
 */
export function getTranslationStatus(state: IReduxState): string {
    const translatorState = getUniversalTranslatorState(state);
    
    return translatorState?.status || 'idle';
}

/**
 * Checks if universal translator dialog is open.
 *
 * @param {Object} state - The Redux state.
 * @returns {boolean} True if dialog is open.
 */
export function isUniversalTranslatorDialogOpen(state: IReduxState): boolean {
    const translatorState = getUniversalTranslatorState(state);
    
    return Boolean(translatorState?.showDialog);
}

/**
 * Gets the current latency metrics.
 *
 * @param {Object} state - The Redux state.
 * @returns {Object} The latency metrics.
 */
export function getLatencyMetrics(state: IReduxState) {
    const translatorState = getUniversalTranslatorState(state);
    
    return translatorState?.latencyMetrics || {
        stt: { averageLatency: 0, lastLatency: 0, requestCount: 0 },
        translation: { averageLatency: 0, lastLatency: 0, requestCount: 0 },
        tts: { averageLatency: 0, lastLatency: 0, requestCount: 0 }
    };
}

/**
 * Gets the total end-to-end latency.
 *
 * @param {Object} state - The Redux state.
 * @returns {number} Total latency in milliseconds.
 */
export function getTotalLatency(state: IReduxState): number {
    const metrics = getLatencyMetrics(state);
    
    return (metrics.stt.lastLatency || 0) + 
           (metrics.translation.lastLatency || 0) + 
           (metrics.tts.lastLatency || 0);
}

/**
 * Checks if all required API keys are configured for current providers.
 *
 * @param {Object} state - The Redux state.
 * @returns {boolean} True if all required keys are present.
 */
export function areApiKeysConfigured(state: IReduxState): boolean {
    const translatorState = getUniversalTranslatorState(state);
    
    if (!translatorState) {
        return false;
    }
    
    const { sttProvider, ttsProvider, translationProvider, apiKeys } = translatorState;
    
    // Check if required API keys are present (skip local/free providers)
    const requiredKeys = [];
    
    if (sttProvider !== 'whisper') {
        requiredKeys.push(sttProvider);
    }
    
    if (ttsProvider !== 'webspeech') {
        requiredKeys.push(ttsProvider);
    }
    
    requiredKeys.push(translationProvider);
    
    return requiredKeys.every(provider => 
        apiKeys[provider as keyof typeof apiKeys] && apiKeys[provider as keyof typeof apiKeys].length > 0
    );
}

/**
 * Gets supported languages for the current configuration.
 *
 * @param {Object} state - The Redux state.
 * @returns {Array} Array of supported language codes.
 */
export function getSupportedLanguages(state: IReduxState): string[] {
    // Common languages supported by most providers
    return [
        'en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 
        'ja', 'ko', 'zh', 'ar', 'hi', 'tr', 'pl', 'nl'
    ];
}

/**
 * Gets the current provider configuration summary.
 *
 * @param {Object} state - The Redux state.
 * @returns {Object} Provider configuration summary.
 */
export function getProviderConfiguration(state: IReduxState) {
    const translatorState = getUniversalTranslatorState(state);
    
    if (!translatorState) {
        return null;
    }
    
    return {
        stt: translatorState.sttProvider,
        translation: translatorState.translationProvider,
        tts: translatorState.ttsProvider,
        sourceLanguage: translatorState.sourceLanguage,
        targetLanguage: translatorState.targetLanguage
    };
}