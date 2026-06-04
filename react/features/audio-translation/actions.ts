import { SET_AUDIO_TRANSLATION_LANGUAGE } from './actionTypes';

/**
 * Sets the target language for AI audio translation. The bridge is asked to
 * translate every remote speaker into this language and the local endpoint
 * subscribes to the resulting translated sources (in addition to the originals,
 * which are ducked during playback). Pass null to turn translation off.
 *
 * @param {string|null} language - The 2-letter ISO target language code, or null
 * to disable translation.
 * @returns {{
 *     language: (string | null),
 *     type: string
 * }}
 */
export function setAudioTranslationLanguage(language: string | null) {
    return {
        type: SET_AUDIO_TRANSLATION_LANGUAGE,
        language
    };
}
