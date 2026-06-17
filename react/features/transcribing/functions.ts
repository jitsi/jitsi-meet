import i18next from 'i18next';

import { IReduxState } from '../app/types';
import { IConfig } from '../base/config/configType';
import { MEET_FEATURES } from '../base/jwt/constants';
import { isJwtFeatureEnabled } from '../base/jwt/functions';

import JITSI_TO_BCP47_MAP from './jitsi-bcp47-map.json';
import logger from './logger';
import TRANSCRIBER_LANGS from './transcriber-langs.json';

const DEFAULT_TRANSCRIBER_LANG = 'en-US';

/**
 * Resolves the requested transcription locale from config, without validating it against the
 * languages supported by the transcriber.
 *
 * @param {IConfig} config - Application config.
 * @returns {string|undefined} - The requested BCP-47 locale, if any.
 */
function getRequestedTranscriptionLocale(config: IConfig) {
    const { transcription } = config;

    // Depending on the config either use the language that the app automatically detected or the hardcoded
    // config BCP47 value.
    // Jitsi language detections uses custom language tags, but the transcriber expects BCP-47 compliant tags,
    // we use a mapping file to convert them.
    return transcription?.useAppLanguage ?? true
        ? JITSI_TO_BCP47_MAP[i18next.language as keyof typeof JITSI_TO_BCP47_MAP]
        : transcription?.preferredLanguage;
}

/**
 * Resolves the BCP-47 locale the transcriber will use, without any logging side effect. Safe to
 * call from selectors / mapStateToProps.
 *
 * @param {IConfig} config - Application config.
 * @returns {string|undefined} - The resolved BCP-47 locale, or undefined if transcriptions are not enabled.
 */
export function getTranscriptionLanguage(config: IConfig) {
    const { transcription } = config;

    // if transcriptions are not enabled nothing to determine
    if (!transcription?.enabled) {
        return undefined;
    }

    const transcriberLangs = {
        ...TRANSCRIBER_LANGS,
        ...(transcription.customLanguages ?? {})
    };
    const bcp47Locale = getRequestedTranscriptionLocale(config);

    // Check if the obtained language is supported by the transcriber
    if (bcp47Locale && transcriberLangs[bcp47Locale as keyof typeof transcriberLangs]) {
        return bcp47Locale;
    }

    return DEFAULT_TRANSCRIBER_LANG;
}

/**
 * Determines which language to use for transcribing and logs the decision.
 *
 * @param {IConfig} config - Application config.
 * @returns {string|undefined} - The resolved BCP-47 locale, or undefined if transcriptions are not enabled.
 */
export function determineTranscriptionLanguage(config: IConfig) {
    const safeBCP47Locale = getTranscriptionLanguage(config);

    if (typeof safeBCP47Locale === 'undefined') {
        return undefined;
    }

    const requested = getRequestedTranscriptionLocale(config);

    // We fell back to the default only if the requested locale wasn't the one we resolved to.
    if (requested !== safeBCP47Locale) {
        logger.warn(`Transcriber language ${requested} is not supported, using default ${DEFAULT_TRANSCRIBER_LANG}`);
    }

    logger.info(`Transcriber language set to ${safeBCP47Locale}`);

    return safeBCP47Locale;
}

/**
 * Returns whether there is transcribing.
 *
 * @param {IReduxState} state - The redux state to search in.
 * @returns {boolean}
 */
export function isTranscribing(state: IReduxState) {
    return state['features/transcribing'].isTranscribing;
}

/**
 * Returns true if there is a recorder transcription session running.
 * NOTE: If only the subtitles are running this function will return false.
 *
 * @param {Object} state - The redux state to search in.
 * @returns {boolean}
 */
export function isRecorderTranscriptionsRunning(state: IReduxState) {
    const { metadata } = state['features/base/conference'];

    return isTranscribing(state) && Boolean(metadata?.recording?.isTranscribingEnabled);
}

/**
 * Checks whether the participant can start the transcription.
 *
 * @param {IReduxState} state - The redux state.
 * @returns {boolean} - True if the participant can start the transcription.
 */
export function canAddTranscriber(state: IReduxState) {
    const { transcription } = state['features/base/config'];
    const isTranscribingAllowed = isJwtFeatureEnabled(state, MEET_FEATURES.TRANSCRIPTION, false);

    return Boolean(transcription?.enabled) && isTranscribingAllowed;
}
