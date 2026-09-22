import i18next from 'i18next';
import { DeviceEventEmitter, NativeModules, Platform } from 'react-native';

import LANGUAGES_RESOURCES from '../../../../lang/languages.json';

import logger from './logger';

const LANGUAGES = Object.keys(LANGUAGES_RESOURCES);
const LATIN_AMERICAN_REGIONS = [
    '419', 'AR', 'BO', 'CL', 'CO', 'CR', 'CU', 'DO', 'EC', 'GT',
    'HN', 'MX', 'NI', 'PA', 'PE', 'PR', 'PY', 'SV', 'US', 'UY', 'VE'
];

let currentLocale: string | undefined;

/**
 * Chinese has no bare 'zh' bundle, so pick by script (Hans/Hant) first, then by region.
 *
 * @param {Array<string>} parts - The locale parts, e.g. ['zh', 'Hans', 'US'].
 * @returns {string}
 */
function detectChinese(parts: string[]) {
    if (parts.includes('Hans')) {
        return 'zh-CN';
    }

    if (parts.includes('Hant') || [ 'HK', 'MO', 'TW' ].includes(parts[1])) {
        return 'zh-TW';
    }

    return 'zh-CN';
}

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

    const parts: string[] = rawLocale.replace(/_/g, '-').split('-');
    const [ lang, ...subtags ] = parts;

    if (lang === 'zh') {
        return detectChinese(parts);
    }

    // Only the first subtag, so an explicit variant wins, e.g. 'es-ES-MX' stays 'es'.
    if (lang === 'es' && LATIN_AMERICAN_REGIONS.includes(subtags[0])) {
        return 'es-US';
    }

    // Try every subtag so variants survive an appended region, e.g. 'fr-CA-US' -> 'fr-CA'.
    const locale = subtags.map(tag => `${lang}-${tag}`).find(l => LANGUAGES.includes(l));

    return locale ?? lang;
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

    try {
        DeviceEventEmitter.addListener('localeChanged', (newLocale: string) => {
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
