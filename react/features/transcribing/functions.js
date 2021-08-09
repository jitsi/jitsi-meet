// @flow

import i18next from 'i18next';

import JITSI_TO_BCP47_MAP from './jitsiToBCP47LocaleMap.json';

const DEFAULT_TRANSCRIBER_LANG = 'en-US';


/**
 * Determine which language to use for transcribing.
 *
 * @param {*} config - Application config.
 * @returns {string}
 */
export function determineTranscriptionLanguage(config: Object) {

    const { preferredTranscribeLanguage, transcribeWithAppLanguage = true } = config;

    // Depending on the config either use the language that the app automatically detected or the hardcoded
    // config value.
    const jitsiLocale = transcribeWithAppLanguage ? i18next.language : preferredTranscribeLanguage;

    // Jitsi uses custom language tags, but the transcriber expects BCP-47 compliant tags. We use a mapping file
    // to convert them.
    // Not all languages that the app might detect are supported by the transcriber in which case use the default.
    const { [jitsiLocale]: bcp47Locale = DEFAULT_TRANSCRIBER_LANG } = JITSI_TO_BCP47_MAP;

    return bcp47Locale;
}
