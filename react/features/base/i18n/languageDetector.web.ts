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

    // Only holds a language the user picked, see storeUserSelectedLanguage.
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
            // Do not cache detected languages, or the config one would win over a later config change.
            caches: [],
            lookupLocalStorage: 'userSelectedLanguage',
            lookupQuerystring: 'lang',
            order
        });

languageDetector.addDetector(safeLangQueryDetector);
languageDetector.addDetector(configLanguageDetector);

/**
 * Moves the language stored under the old 'language' key, where every detected language used to be cached, to the
 * key that holds the language the user picked. It cannot tell a pick from a cached one, so it is only kept when it
 * differs from what is detected without it. Needs i18next to be initialized and config.js to be loaded.
 *
 * @returns {void}
 */
export function migrateLegacyLanguage() {
    try {
        const legacyLanguage = window.localStorage.getItem('language');

        if (legacyLanguage === null) {
            return;
        }

        window.localStorage.removeItem('language');

        const lang = SUPPORTED_LANGUAGES.get(legacyLanguage.toLowerCase());

        if (lang && !window.localStorage.getItem('userSelectedLanguage') && lang !== languageDetector.detect()) {
            languageDetector.cacheUserLanguage(lang, [ 'localStorage' ]);
        }
    } catch {
        // localStorage may not be available.
    }
}

export default languageDetector;
