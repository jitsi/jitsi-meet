import { NativeModules } from 'react-native';

import LANGUAGES_RESOURCES from '../../../../lang/languages.json';

const LANGUAGES = Object.keys(LANGUAGES_RESOURCES);

/**
 * The singleton language detector for React Native which uses the system-wide
 * locale.
 */
export default {
    /**
     * Does not support caching.
     *
     * @returns {void}
     */
    cacheUserLanguage: Function.prototype,

    detect() {
        const { LocaleDetector } = NativeModules;
        const parts = LocaleDetector.locale.replace(/_/, '-').split('-');
        const [ lang, regionOrScript, region ] = parts;
        let locale;

        if (parts.length >= 3) {
            locale = `${lang}${region}`;
        } else if (parts.length === 2) {
            locale = `${lang}${regionOrScript}`;
        } else {
            locale = lang;
        }

        if (LANGUAGES.includes(locale)) {
            return locale;
        }

        return lang;
    },

    init: Function.prototype,

    type: 'languageDetector'
};
