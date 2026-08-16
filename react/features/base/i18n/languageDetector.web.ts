import BrowserLanguageDetector from 'i18next-browser-languagedetector';
import { noop } from 'lodash-es';

import LANGUAGES_RESOURCES from '../../../../lang/languages.json';

import configLanguageDetector from './configLanguageDetector';

// Map from lowercased key → original key (e.g. 'fr-ca' → 'fr-CA') for
// case-insensitive lookup that still returns the exact casing i18next expects.
const SUPPORTED_LANGUAGES = new Map(
    Object.keys(LANGUAGES_RESOURCES).map(lang => [ lang.toLowerCase(), lang ])
);

/**
 * Custom querystring language detector that validates the raw `lang` query
 * parameter against the application's supported-language allowlist before
 * returning it. This prevents unsanitized user-controlled input from reaching
 * i18next internals (defence-in-depth on top of i18next's own whitelist).
 */
const safeLangQueryDetector = {
    name: 'safeLangQuery',
    cacheUserLanguage: noop,
    lookup() {
        const value = new URLSearchParams(window.location.search).get('lang');

        const lang = value && SUPPORTED_LANGUAGES.get(value.toLowerCase());

        if (lang) {
            return lang;
        }

        return undefined;
    }
};

/**
 * The ordered list (by name) of language detectors to be utilized as backends
 * by the singleton language detector for Web.
 *
 * @type {Array<string>}
 */
const order = [
    safeLangQueryDetector.name,
    'localStorage'
];

// Allow i18next to detect the system language reported by the Web browser
// itself.
interfaceConfig.LANG_DETECTION && order.push('navigator');

// Default use configured language
order.push(configLanguageDetector.name);

/**
 * The singleton language detector for Web.
 */
const languageDetector
    = new BrowserLanguageDetector(
        /* services */ null,
        /* options */ {
            caches: [ 'localStorage' ],
            lookupLocalStorage: 'language',
            lookupQuerystring: 'lang',
            order
        });

languageDetector.addDetector(safeLangQueryDetector);
languageDetector.addDetector(configLanguageDetector);

export default languageDetector;
