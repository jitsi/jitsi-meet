import i18next from 'i18next';
import I18nextXHRBackend from 'i18next-xhr-backend';

import LANGUAGES_RESOURCES from '../../../../lang/languages.json';
import MAIN_RESOURCES from '../../../../lang/main.json';

import { DEFAULT_LANGUAGE, LANGUAGES } from './constants';
import languageDetector from './languageDetector';

declare var interfaceConfig: Object;

/**
 * The options to initialize i18next with.
 *
 * @type {Object}
 */
const options = {
    app:
        (typeof interfaceConfig !== 'undefined' && interfaceConfig.APP_NAME)
            || 'Jitsi Meet',
    compatibilityAPI: 'v1',
    compatibilityJSON: 'v1',
    fallbackLng: DEFAULT_LANGUAGE,
    fallbackOnEmpty: true,
    fallbackOnNull: true,

    // XXX i18next modifies the array lngWhitelist so make sure to clone
    // LANGUAGES.
    lngWhitelist: LANGUAGES.slice(),
    load: 'unspecific',
    ns: {
        defaultNs: 'main',
        namespaces: [ 'main', 'languages' ]
    },
    resGetPath: 'lang/__ns__-__lng__.json',
    useDataAttrOptions: true
};

i18next
    .use(I18nextXHRBackend)
    .use(languageDetector)
    .use({
        name: 'resolveAppName',
        process: (res, key) => i18next.t(key, { app: options.app }),
        type: 'postProcessor'
    })
    .init(options);

// Add default language which is preloaded from the source code.
i18next.addResourceBundle(
    DEFAULT_LANGUAGE,
    'main',
    MAIN_RESOURCES,
    /* deep */ true,
    /* overwrite */ true);
i18next.addResourceBundle(
    DEFAULT_LANGUAGE,
    'languages',
    LANGUAGES_RESOURCES,
    /* deep */ true,
    /* overwrite */ true);

export default i18next;
