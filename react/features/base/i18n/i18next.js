// @flow

declare var APP: Object;

import COUNTRIES_RESOURCES from 'i18n-iso-countries/langs/en.json';
import i18next from 'i18next';
import I18nextXHRBackend from 'i18next-xhr-backend';

import LANGUAGES_RESOURCES from '../../../../lang/languages.json';
import MAIN_RESOURCES from '../../../../lang/main.json';

import { I18NEXT_INITIALIZED, LANGUAGE_CHANGED } from './actionTypes';
import languageDetector from './languageDetector';

/**
 * The available/supported languages.
 *
 * @public
 * @type {Array<string>}
 */
export const LANGUAGES: Array<string> = Object.keys(LANGUAGES_RESOURCES);

/**
 * The default language.
 *
 * English is the default language.
 *
 * @public
 * @type {string} The default language.
 */
export const DEFAULT_LANGUAGE = 'en';

/**
 * The options to initialize i18next with.
 *
 * @type {Object}
 */
const options = {
    backend: {
        loadPath: 'lang/{{ns}}-{{lng}}.json'
    },
    defaultNS: 'main',
    fallbackLng: DEFAULT_LANGUAGE,
    interpolation: {
        escapeValue: false // not needed for react as it escapes by default
    },
    load: 'languageOnly',
    ns: [ 'main', 'languages', 'countries' ],
    react: {
        // re-render when a new resource bundle is added
        bindI18nStore: 'added',
        useSuspense: false
    },
    returnEmptyString: false,
    returnNull: false,

    // XXX i18next modifies the array lngWhitelist so make sure to clone
    // LANGUAGES.
    whitelist: LANGUAGES.slice()
};

i18next
    .use(navigator.product === 'ReactNative' ? {} : I18nextXHRBackend)
    .use(languageDetector)
    .init(options);

// Add default language which is preloaded from the source code.
i18next.addResourceBundle(
    DEFAULT_LANGUAGE,
    'countries',
    COUNTRIES_RESOURCES,
    /* deep */ true,
    /* overwrite */ true);
i18next.addResourceBundle(
    DEFAULT_LANGUAGE,
    'languages',
    LANGUAGES_RESOURCES,
    /* deep */ true,
    /* overwrite */ true);
i18next.addResourceBundle(
    DEFAULT_LANGUAGE,
    'main',
    MAIN_RESOURCES,
    /* deep */ true,
    /* overwrite */ true);

// Add builtin languages.
// XXX: Note we are using require here, because we want the side-effects of the
// import, but imports can only be placed at the top, and it would be too early,
// since i18next is not yet initialized at that point.
require('./BuiltinLanguages');

// Label change through dynamic branding is available only for web
if (typeof APP !== 'undefined') {
    i18next.on('initialized', () => {
        APP.store.dispatch({ type: I18NEXT_INITIALIZED });
    });

    i18next.on('languageChanged', () => {
        APP.store.dispatch({ type: LANGUAGE_CHANGED });
    });
}

export default i18next;
