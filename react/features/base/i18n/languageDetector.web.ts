import { jitsiLocalStorage } from '@jitsi/js-utils/jitsi-local-storage';
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
 * The key under which the language the user picked is stored.
 */
const USER_SELECTED_LANGUAGE_KEY = 'userSelectedLanguage';

/**
 * Language detector for the language the user picked in the settings. It goes through jitsiLocalStorage, so the pick
 * also survives in embeds that keep the local storage on the host page.
 */
const userSelectedLanguageDetector = {
    name: 'userSelectedLanguage',
    cacheUserLanguage(lng: string) {
        jitsiLocalStorage.setItem(USER_SELECTED_LANGUAGE_KEY, lng);
    },
    lookup() {
        const value = jitsiLocalStorage.getItem(USER_SELECTED_LANGUAGE_KEY);

        return (value && SUPPORTED_LANGUAGES.get(value.toLowerCase())) || undefined;
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
    userSelectedLanguageDetector.name
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
            lookupQuerystring: 'lang',
            order
        });

languageDetector.addDetector(safeLangQueryDetector);
languageDetector.addDetector(userSelectedLanguageDetector);
languageDetector.addDetector(configLanguageDetector);

/**
 * Stores the language the user picked, so it is restored on the next load.
 *
 * @param {string} language - The language the user picked.
 * @returns {void}
 */
export function storeUserSelectedLanguage(language: string) {
    languageDetector.cacheUserLanguage(language, [ userSelectedLanguageDetector.name ]);
}

/**
 * Moves the language stored under the old 'language' key, where i18next used to cache every detected language, to
 * the key that holds the language the user picked. It cannot tell a pick from a cached one, so it is only kept when
 * it differs from what the browser and config give. Needs i18next to be initialized and config.js to be loaded.
 *
 * @returns {void}
 */
export function migrateLegacyLanguage() {
    try {
        const legacyLanguage = window.localStorage.getItem('language');

        if (legacyLanguage === null) {
            return;
        }

        const lang = SUPPORTED_LANGUAGES.get(legacyLanguage.toLowerCase());
        const detectionOrder = order.filter(
            name => name !== safeLangQueryDetector.name && name !== userSelectedLanguageDetector.name);

        if (lang
                && !userSelectedLanguageDetector.lookup()

                // @ts-expect-error The 3.0.1 types take DetectorOptions, the code takes the detection order.
                && lang !== languageDetector.detect(detectionOrder)) {
            storeUserSelectedLanguage(lang);
        }

        window.localStorage.removeItem('language');
    } catch {
        // localStorage may not be available.
    }
}

export default languageDetector;
