import {
    CLEAR_AUDIO_TRANSLATION,
    CLEAR_RECEIVING_TRANSLATED_SOURCES,
    SET_AUDIO_TRANSLATION_LANGUAGE,
    SET_PARTICIPANT_AUDIO_TRANSLATION_LANGUAGE,
    SET_TRANSLATION_LISTENERS,
    UPDATE_TRANSLATED_SOURCE_SENDING
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
 * Clears the set of translated sources the bridge is currently forwarding to us. Used when the
 * conference is left so stale received-translation state does not leak into the next conference.
 *
 * @returns {{
 *     type: string
 * }}
 */
export function clearReceivingTranslatedSources() {
    return {
        type: CLEAR_RECEIVING_TRANSLATED_SOURCES
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

/**
 * Sets the endpoint ids of the remote participants currently translating the local participant's audio,
 * as pushed by the audio-translation component. Drives the per-participant "translation enabled" badge.
 *
 * @param {Array<string>} ids - The endpoint ids translating the local participant.
 * @returns {{
 *     ids: Array<string>,
 *     type: string
 * }}
 */
export function setTranslationListeners(ids: string[]) {
    return {
        type: SET_TRANSLATION_LISTENERS,
        ids
    };
}

/**
 * Records whether the bridge is currently forwarding a translated source to the local endpoint. A translated
 * source follows the {@code <endpointId>-a<idx>.<lang>} convention. The timestamp is the RTP timestamp from the
 * event (48 kHz, wraps) and is kept for completeness only — the boolean state is last-write-wins.
 *
 * @param {string} sourceName - The translated source name.
 * @param {boolean} sending - Whether the bridge started (true) or stopped (false) forwarding the source.
 * @param {number} timestamp - The RTP timestamp carried by the event.
 * @returns {{
 *     sending: boolean,
 *     sourceName: string,
 *     timestamp: number,
 *     type: string
 * }}
 */
export function updateTranslatedSourceSending(sourceName: string, sending: boolean, timestamp: number) {
    return {
        type: UPDATE_TRANSLATED_SOURCE_SENDING,
        sending,
        sourceName,
        timestamp
    };
}
