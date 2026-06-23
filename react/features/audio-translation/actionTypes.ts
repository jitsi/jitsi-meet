/**
 * The type of (redux) action which clears all AI audio translation state (the default
 * language and every per-participant override), e.g. after the bridge rejects a request.
 */
export const CLEAR_AUDIO_TRANSLATION = 'CLEAR_AUDIO_TRANSLATION';

/**
 * The type of (redux) action which sets the default AI audio translation target
 * language for every speaker, or null when translation is turned off.
 */
export const SET_AUDIO_TRANSLATION_LANGUAGE = 'SET_AUDIO_TRANSLATION_LANGUAGE';

/**
 * The type of (redux) action which sets the AI audio translation target language
 * for a single participant (overriding the default), or null to disable it for
 * that participant.
 */
export const SET_PARTICIPANT_AUDIO_TRANSLATION_LANGUAGE = 'SET_PARTICIPANT_AUDIO_TRANSLATION_LANGUAGE';
