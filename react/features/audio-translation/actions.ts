import {
    CLEAR_AUDIO_TRANSLATION,
    SET_AUDIO_TRANSLATION_LANGUAGE,
    SET_PARTICIPANT_AUDIO_TRANSLATION_LANGUAGE
} from './actionTypes';

/**
 * Clears all AI audio translation state — the default language and every per-participant
 * override. Used to reset the feature, e.g. when the bridge rejects a translation request.
 *
 * @returns {{
 *     type: string
 * }}
 */
export function clearAudioTranslation() {
    return {
        type: CLEAR_AUDIO_TRANSLATION
    };
}

/**
 * Sets the default target language for AI audio translation. The bridge is asked
 * to translate every remote speaker into this language and the local endpoint
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

/**
 * Sets the AI audio translation target language for a single participant,
 * overriding the default. Pass null to disable translation for that participant.
 *
 * @param {string} participantId - The participant whose translation language to set.
 * @param {string|null} language - The 2-letter ISO target language code, or null
 * to disable translation for this participant.
 * @returns {{
 *     language: (string | null),
 *     participantId: string,
 *     type: string
 * }}
 */
export function setParticipantAudioTranslationLanguage(participantId: string, language: string | null) {
    return {
        type: SET_PARTICIPANT_AUDIO_TRANSLATION_LANGUAGE,
        participantId,
        language
    };
}
