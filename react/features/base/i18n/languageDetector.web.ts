import BrowserLanguageDetector from 'i18next-browser-languagedetector';

import configLanguageDetector from './configLanguageDetector';

/**
 * The ordered list (by name) of language detectors to be utilized as backends
 * by the singleton language detector for Web.
 *
 * @type {Array<string>}
 */
const order = [
    'querystring',
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

// @ts-ignore
languageDetector.addDetector(configLanguageDetector);

export default languageDetector;
