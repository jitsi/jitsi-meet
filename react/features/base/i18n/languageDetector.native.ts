import i18next from 'i18next';
import { NativeEventEmitter, NativeModules, Platform } from 'react-native';

import LANGUAGES_RESOURCES from '../../../../lang/languages.json';

import logger from './logger';

const LANGUAGES = Object.keys(LANGUAGES_RESOURCES);

let currentLocale: string | undefined;

/**
 * Parses a locale tag to find a matching supported language.
 *
 * @param {string} [rawLocale] - The raw locale string.
 * @returns {string} The matched language code.
 */
export function parseLocale(rawLocale?: string): string {
    if (!rawLocale) {
        return 'en';
    }

    const parts = rawLocale.replace(/_/, '-').split('-');
    const [ lang, regionOrScript, region ] = parts;
    let locale;

    if (parts.length >= 3) {
        locale = `${lang}-${region}`;
    } else if (parts.length === 2) {
        locale = `${lang}-${regionOrScript}`;
    } else {
        locale = lang;
    }

    if (LANGUAGES.includes(locale)) {
        return locale;
    }

    return lang;
}

/**
 * Attaches a listener for native system locale changes on Android.
 *
 * @returns {void}
 */
function setupLocaleListener() {
    if (Platform.OS !== 'android') {
        return;
    }

    const { LocaleDetector } = NativeModules;

    if (!LocaleDetector) {
        return;
    }

    try {
        const localeEventEmitter = new NativeEventEmitter(LocaleDetector);

        localeEventEmitter.addListener('localeChanged', (newLocale: string) => {
            currentLocale = newLocale;
            const newLanguage = parseLocale(newLocale);

            if (newLanguage && newLanguage !== i18next.language) {
                i18next.changeLanguage(newLanguage).catch(err => {
                    logger.error('Error changing language on system locale update', err);
                });
            }
        });
    } catch (error) {
        logger.error('Failed to set up locale change listener', error);
    }
}

setupLocaleListener();

/**
 * The singleton language detector for React Native which uses the system-wide
 * locale.
 */
export default {
    /**
     * Does not support caching.
     *
     * @returns {void}
     */
    cacheUserLanguage: Function.prototype,

    detect() {
        const { LocaleDetector } = NativeModules;
        const locale = currentLocale || LocaleDetector?.locale;

        return parseLocale(locale);
    },

    init: Function.prototype,

    type: 'languageDetector'
};
