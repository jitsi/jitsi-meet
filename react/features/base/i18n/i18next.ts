import COUNTRIES_RESOURCES from 'i18n-iso-countries/langs/en.json';
import i18next from 'i18next';
import I18nextXHRBackend, { HttpBackendOptions } from 'i18next-http-backend';
import { merge } from 'lodash-es';

import LANGUAGES_RESOURCES from '../../../../lang/languages.json';
import MAIN_RESOURCES from '../../../../lang/main.json';
import TRANSLATION_LANGUAGES_RESOURCES from '../../../../lang/translation-languages.json';

import { I18NEXT_INITIALIZED, LANGUAGE_CHANGED } from './actionTypes';
import languageDetector from './languageDetector.web';

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
const COUNTRIES = merge({}, COUNTRIES_RESOURCES, COUNTRIES_RESOURCES_OVERRIDES);

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
 * The default language.
 *
 * English is the default language.
 *
 * @public
 * @type {string} The default language.
 */
export const DEFAULT_LANGUAGE = 'en';

/**
 * The available/supported translation languages head. (Languages displayed on the top ).
 *
 * @public
 * @type {Array<string>}
 */
export const TRANSLATION_LANGUAGES_HEAD: Array<string> = [DEFAULT_LANGUAGE];

/**
 * The options to initialize i18next with.
 *
 * @type {i18next.InitOptions}
 */
const options: i18next.InitOptions = {
    backend: <HttpBackendOptions>{
        loadPath: (lng: string[], ns: string[]) => {
            switch (ns[0]) {
                case 'countries':
                case 'main':
                    return `lang/${ns[0]}-${lng[0]}.json`;
                default:
                    return `lang/${ns[0]}.json`;
            }
        }
    },
    defaultNS: 'main',
    fallbackLng: DEFAULT_LANGUAGE,
    interpolation: {
        escapeValue: false // not needed for react as it escapes by default
    },
    load: 'languageOnly',
    ns: ['main', 'languages', 'countries', 'translation-languages'],
    react: {
        // re-render when a new resource bundle is added
        bindI18nStore: 'added',
        useSuspense: false
    },
    returnEmptyString: false,
    returnNull: false,
    // Clone LANGUAGES to prevent i18next from modifying the original array
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
    true, // deep
    true  // overwrite
);
i18next.addResourceBundle(
    DEFAULT_LANGUAGE,
    'languages',
    LANGUAGES_RESOURCES,
    true, // deep
    true  // overwrite
);
i18next.addResourceBundle(
    DEFAULT_LANGUAGE,
    'translation-languages',
    TRANSLATION_LANGUAGES_RESOURCES,
    true, // deep
    true  // overwrite
);
i18next.addResourceBundle(
    DEFAULT_LANGUAGE,
    'main',
    MAIN_RESOURCES,
    true, // deep
    true  // overwrite
);

// Add builtin languages.
// Using require here to ensure side-effects are applied after i18next initialization.
require('./BuiltinLanguages');

// Dispatch actions for initialization and language changes in a web environment.
if (typeof APP !== 'undefined') {
    i18next.on('initialized', () => {
        APP.store.dispatch({ type: I18NEXT_INITIALIZED });
    });

    i18next.on('languageChanged', () => {
        APP.store.dispatch({ type: LANGUAGE_CHANGED });
    });
}

export default i18next;