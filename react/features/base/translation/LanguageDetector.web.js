/* global interfaceConfig */
import Browser from 'i18next-browser-languagedetector';
import ConfigLanguageDetector from './ConfigLanguageDetector';

/**
 * List of detectors to use in their order.
 *
 * @type {[*]}
 */
const detectors = [ 'querystring', 'localStorage', 'configLanguageDetector' ];

/**
 * Allow i18n to detect the system language from the browser.
 */
if (interfaceConfig.LANG_DETECTION) {
    detectors.push('navigator');
}

/**
 * The language detectors.
 */
const browser = new Browser(null, {
    order: detectors,
    lookupQuerystring: 'lang',
    lookupLocalStorage: 'language',
    caches: [ 'localStorage' ]
});

/**
 * adds a language detector that just checks the config
 */
browser.addDetector(ConfigLanguageDetector);

export default browser;
