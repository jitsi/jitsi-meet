/**
 * The type of (redux) action which clears all AI audio translation state (the default
 * language and every per-participant override), e.g. after the bridge rejects a request.
 */
export const CLEAR_AUDIO_TRANSLATION = 'CLEAR_AUDIO_TRANSLATION';

/**
 * The type of (redux) action which clears the set of translated sources the bridge is currently
 * forwarding to us, e.g. when the conference is left.
 */
export const CLEAR_RECEIVING_TRANSLATED_SOURCES = 'CLEAR_RECEIVING_TRANSLATED_SOURCES';

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

/**
 * The type of (redux) action which sets the list of remote participants currently translating the local
 * participant's audio (i.e. who to show the "translation enabled" badge on).
 */
export const SET_TRANSLATION_LISTENERS = 'SET_TRANSLATION_LISTENERS';

/**
 * The type of (redux) action which records that the bridge started or stopped forwarding a translated
 * source to the local endpoint (i.e. whether we are hearing that source translated).
 */
export const UPDATE_TRANSLATED_SOURCE_SENDING = 'UPDATE_TRANSLATED_SOURCE_SENDING';
