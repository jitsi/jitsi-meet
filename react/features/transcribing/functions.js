// @flow

import i18next from 'i18next';

import JITSI_TO_BCP47_MAP from './jitsi-bcp47-map.json';
import logger from './logger';
import TRANSCRIBER_LANGS from './transcriber-langs.json';

const DEFAULT_TRANSCRIBER_LANG = 'en-US';

/**
 * Determine which language to use for transcribing.
 *
 * @param {*} config - Application config.
 * @returns {string}
 */
export function determineTranscriptionLanguage(config: Object) {
    const { preferredTranscribeLanguage, transcribeWithAppLanguage = true, transcribingEnabled } = config;

    // if transcriptions are not enabled nothing to determine
    if (!transcribingEnabled) {
        return undefined;
    }

    // Depending on the config either use the language that the app automatically detected or the hardcoded
    // config BCP47 value.
    // Jitsi language detections uses custom language tags, but the transcriber expects BCP-47 compliant tags,
    // we use a mapping file to convert them.
    const bcp47Locale = transcribeWithAppLanguage ? JITSI_TO_BCP47_MAP[i18next.language] : preferredTranscribeLanguage;

    // Check if the obtained language is supported by the transcriber
    let safeBCP47Locale = TRANSCRIBER_LANGS[bcp47Locale] && bcp47Locale;

    if (!safeBCP47Locale) {
        safeBCP47Locale = DEFAULT_TRANSCRIBER_LANG;
        logger.warn(`Transcriber language ${bcp47Locale} is not supported, using default ${DEFAULT_TRANSCRIBER_LANG}`);
    }

    logger.info(`Transcriber language set to ${safeBCP47Locale}`);

    return safeBCP47Locale;
}
