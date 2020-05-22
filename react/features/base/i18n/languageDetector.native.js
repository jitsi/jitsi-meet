// @flow

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
        const localeString =
            Platform.OS === 'ios'
                ? NativeModules.SettingsManager.settings.AppleLocale ||
                NativeModules.SettingsManager.settings.AppleLanguages[0] //iOS 13
                : NativeModules.I18nManager.localeIdentifier;

        const [ lang, region ] = localeString.replace(/_/, '-').split('-');
        const locale = `${lang}${region}`;

        if (LANGUAGES.includes(locale)) {
            return locale;
        }

        return lang;
    },

    init: Function.prototype,

    type: 'languageDetector'
};
