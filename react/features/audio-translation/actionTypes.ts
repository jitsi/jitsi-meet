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
