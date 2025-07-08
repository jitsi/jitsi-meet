import { IStore } from '../app/types';
import { hideDialog, openDialog } from '../base/dialog/actions';

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
import { UniversalTranslatorDialog } from './components';

/**
 * Initializes the universal translator with service providers.
 *
 * @param {Object} config - Configuration for service providers.
 * @returns {Object} Redux action.
 */
export function initUniversalTranslator(config: any) {
    return {
        type: INIT_UNIVERSAL_TRANSLATOR,
        config
    };
}

/**
 * Sets the STT (Speech-to-Text) provider.
 *
 * @param {string} provider - The STT provider name.
 * @returns {Object} Redux action.
 */
export function setSTTProvider(provider: string) {
    return {
        type: SET_STT_PROVIDER,
        provider
    };
}

/**
 * Sets the TTS (Text-to-Speech) provider.
 *
 * @param {string} provider - The TTS provider name.
 * @returns {Object} Redux action.
 */
export function setTTSProvider(provider: string) {
    return {
        type: SET_TTS_PROVIDER,
        provider
    };
}

/**
 * Sets the translation provider.
 *
 * @param {string} provider - The translation provider name.
 * @returns {Object} Redux action.
 */
export function setTranslationProvider(provider: string) {
    return {
        type: SET_TRANSLATION_PROVIDER,
        provider
    };
}

/**
 * Sets the source language for translation.
 *
 * @param {string} language - The source language code.
 * @returns {Object} Redux action.
 */
export function setSourceLanguage(language: string) {
    return {
        type: SET_SOURCE_LANGUAGE,
        language
    };
}

/**
 * Sets the target language for translation.
 *
 * @param {string} language - The target language code.
 * @returns {Object} Redux action.
 */
export function setTargetLanguage(language: string) {
    return {
        type: SET_TARGET_LANGUAGE,
        language
    };
}

/**
 * Starts translation recording.
 *
 * @returns {Object} Redux action.
 */
export function startTranslationRecording() {
    return {
        type: START_TRANSLATION_RECORDING
    };
}

/**
 * Stops translation recording.
 *
 * @returns {Object} Redux action.
 */
export function stopTranslationRecording() {
    return {
        type: STOP_TRANSLATION_RECORDING
    };
}

/**
 * Updates the translation status.
 *
 * @param {string} status - The current status.
 * @returns {Object} Redux action.
 */
export function updateTranslationStatus(status: string) {
    return {
        type: UPDATE_TRANSLATION_STATUS,
        status
    };
}

/**
 * Updates the current processing step.
 *
 * @param {string} step - The current processing step.
 * @returns {Object} Redux action.
 */
export function updateProcessingStep(step: string) {
    return {
        type: UPDATE_PROCESSING_STEP,
        step
    };
}

/**
 * Sets the transcription result.
 *
 * @param {Object} result - The transcription result.
 * @returns {Object} Redux action.
 */
export function setTranscriptionResult(result: any) {
    return {
        type: SET_TRANSCRIPTION_RESULT,
        result
    };
}

/**
 * Sets the translation result.
 *
 * @param {Object} result - The translation result.
 * @returns {Object} Redux action.
 */
export function setTranslationResult(result: any) {
    return {
        type: SET_TRANSLATION_RESULT,
        result
    };
}

/**
 * Updates latency metrics for different services.
 *
 * @param {Object} metrics - The latency metrics.
 * @returns {Object} Redux action.
 */
export function updateLatencyMetrics(metrics: any) {
    return {
        type: UPDATE_LATENCY_METRICS,
        metrics
    };
}

/**
 * Sets a translation error.
 *
 * @param {string} error - The error message.
 * @returns {Object} Redux action.
 */
export function setTranslationError(error: string) {
    return {
        type: SET_TRANSLATION_ERROR,
        error
    };
}

/**
 * Clears the translation error.
 *
 * @returns {Object} Redux action.
 */
export function clearTranslationError() {
    return {
        type: CLEAR_TRANSLATION_ERROR
    };
}

/**
 * Sets API keys for various services.
 *
 * @param {Object} keys - Object containing API keys for different services.
 * @returns {Object} Redux action.
 */
export function setApiKeys(keys: any) {
    return {
        type: SET_API_KEYS,
        keys
    };
}

/**
 * Toggles the universal translator dialog.
 *
 * @returns {Function} Redux thunk action.
 */
export function toggleUniversalTranslator() {
    return (dispatch: IStore['dispatch'], getState: IStore['getState']) => {
        const state = getState();
        const universalTranslator = state['features/universal-translator'];

        if (universalTranslator?.showDialog) {
            dispatch(hideDialog(UniversalTranslatorDialog));
        } else {
            dispatch(openDialog(UniversalTranslatorDialog));
        }

        dispatch({
            type: TOGGLE_UNIVERSAL_TRANSLATOR
        });
    };
}

/**
 * Shows the universal translator dialog.
 *
 * @returns {Function} Redux thunk action.
 */
export function showUniversalTranslatorDialog() {
    return (dispatch: IStore['dispatch']) => {
        dispatch(openDialog(UniversalTranslatorDialog));
        dispatch({
            type: TOGGLE_UNIVERSAL_TRANSLATOR
        });
    };
}

/**
 * Hides the universal translator dialog.
 *
 * @returns {Function} Redux thunk action.
 */
export function hideUniversalTranslatorDialog() {
    return (dispatch: IStore['dispatch']) => {
        dispatch(hideDialog(UniversalTranslatorDialog));
        dispatch({
            type: TOGGLE_UNIVERSAL_TRANSLATOR
        });
    };
}

/**
 * Enables the universal translator effect on the audio track.
 *
 * @returns {Object} Redux action.
 */
export function enableUniversalTranslatorEffect() {
    return {
        type: ENABLE_UNIVERSAL_TRANSLATOR_EFFECT
    };
}

/**
 * Disables the universal translator effect on the audio track.
 *
 * @returns {Object} Redux action.
 */
export function disableUniversalTranslatorEffect() {
    return {
        type: DISABLE_UNIVERSAL_TRANSLATOR_EFFECT
    };
}
