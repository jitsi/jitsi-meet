import COUNTRIES_RESOURCES from 'i18n-iso-countries/langs/en.json';
import i18next from 'i18next';
import I18nextXHRBackend, { HttpBackendOptions } from 'i18next-http-backend';
import _ from 'lodash';

import LANGUAGES_RESOURCES from '../../../../lang/languages.json';
import MAIN_RESOURCES from '../../../../lang/main.json';
import TRANSLATION_LANGUAGES_RESOURCES from '../../../../lang/translation-languages.json';

import { I18NEXT_INITIALIZED, LANGUAGE_CHANGED } from './actionTypes';
import languageDetector from './languageDetector';

/**
 * Override certain country names.
 */
const COUNTRIES_RESOURCES_OVERRIDES = {
    countries: {
        TW: 'Taiwan'
    }
};

/**
 * Merged country names.
 */
const COUNTRIES = _.merge({}, COUNTRIES_RESOURCES, COUNTRIES_RESOURCES_OVERRIDES);

/**
 * The available/supported languages.
 *
 * @public
 * @type {Array<string>}
 */
export const LANGUAGES: Array<string> = Object.keys(LANGUAGES_RESOURCES);

/**
 * The available/supported translation languages.
 *
 * @public
 * @type {Array<string>}
 */
export const TRANSLATION_LANGUAGES: Array<string> = Object.keys(TRANSLATION_LANGUAGES_RESOURCES);

/**
 * The available/supported translation languages head. (Languages displayed on the top ).
 *
 * @public
 * @type {Array<string>}
 */
export const TRANSLATION_LANGUAGES_HEAD: Array<string> = [ 'en' ];

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
 * @type {i18next.InitOptions}
 */
const options: i18next.InitOptions = {
    backend: <HttpBackendOptions>{
        loadPath: (lng: string[], ns: string[]) =>
            // eslint-disable-next-line no-extra-parens
            (ns[0] === 'main' ? 'lang/{{ns}}-{{lng}}.json' : 'lang/{{ns}}.json')
    },
    defaultNS: 'main',
    fallbackLng: DEFAULT_LANGUAGE,
    interpolation: {
        escapeValue: false // not needed for react as it escapes by default
    },
    load: 'languageOnly',
    ns: [ 'main', 'languages', 'countries', 'translation-languages' ],
    react: {
        // re-render when a new resource bundle is added
        // @ts-expect-error. Fixed in i18next 19.6.1.
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
    COUNTRIES,
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
    'translation-languages',
    TRANSLATION_LANGUAGES_RESOURCES,
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
