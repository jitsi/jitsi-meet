import BrowserLanguageDetector from 'i18next-browser-languagedetector';
import { noop } from 'lodash-es';

import configLanguageDetector from './configLanguageDetector';
import { LANGUAGES } from './supportedLanguages';

// Map from lowercased key → original key (e.g. 'fr-CA' → 'fr-CA') for
// case-insensitive normalization before passing to i18next.
// Filtering against config.supportedLanguages is handled by i18next whitelist.
const LANG_NORMALIZE_MAP = new Map(
    LANGUAGES.map(lang => [ lang.toLowerCase(), lang ])
);

/**
 * Custom querystring language detector that normalizes the raw `lang` query
 * parameter to the exact casing i18next expects (e.g. 'fr-ca' → 'fr-CA').
 * Filtering against config.supportedLanguages is delegated to i18next whitelist.
 */
const safeLangQueryDetector = {
    name: 'safeLangQuery',
    cacheUserLanguage: noop,
    lookup() {
        const value = new URLSearchParams(window.location.search).get('lang');

        const lang = value && LANG_NORMALIZE_MAP.get(value.toLowerCase());

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
