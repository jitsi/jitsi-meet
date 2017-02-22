/* global interfaceConfig */
import i18n from 'i18next';
import XHR from 'i18next-xhr-backend';
import { DEFAULT_LANG, languages } from './constants';
import languagesR from '../../../../lang/languages.json';
import mainR from '../../../../lang/main.json';
import Browser from 'i18next-browser-languagedetector';
import ConfigLanguageDetector from './ConfigLanguageDetector';

/**
 * Default options to initialize i18next.
 *
 * @enum {string}
 */
const defaultOptions = {
    compatibilityAPI: 'v1',
    compatibilityJSON: 'v1',
    fallbackLng: DEFAULT_LANG,
    load: 'unspecific',
    resGetPath: 'lang/__ns__-__lng__.json',
    ns: {
        namespaces: [ 'main', 'languages' ],
        defaultNs: 'main'
    },
    lngWhitelist: languages.getLanguages(),
    fallbackOnNull: true,
    fallbackOnEmpty: true,
    useDataAttrOptions: true,
    app: interfaceConfig.APP_NAME
};

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

// adds a language detector that just checks the config
browser.addDetector(ConfigLanguageDetector);

i18n.use(XHR)
    .use(browser)
    .use({
        type: 'postProcessor',
        name: 'resolveAppName',
        process: (res, key) => i18n.t(key, { app: defaultOptions.app })
    })
    .init(defaultOptions);

// adds default language which is preloaded from code
i18n.addResourceBundle(DEFAULT_LANG, 'main', mainR, true, true);
i18n.addResourceBundle(DEFAULT_LANG, 'languages', languagesR, true, true);

export default i18n;
