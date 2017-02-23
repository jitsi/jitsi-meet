/* global interfaceConfig */
import i18n from 'i18next';
import XHR from 'i18next-xhr-backend';
import { DEFAULT_LANG, languages } from './constants';
import languagesR from '../../../../lang/languages.json';
import mainR from '../../../../lang/main.json';

import LanguageDetector from './LanguageDetector';

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
    app: typeof interfaceConfig === 'undefined'
        ? 'Jitsi Meet' : interfaceConfig.APP_NAME
};

i18n.use(XHR)
    .use(LanguageDetector)
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
