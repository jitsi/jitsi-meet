import { noop } from 'lodash-es';

declare let config: any;

/**
 * Custom language detection, just returns the config property if any.
 */
export default {
    cacheUserLanguage: noop,

    /**
     * Looks the language up in the config.
     *
     * @returns {string} The default language if any.
     */
    lookup() {
        return config.defaultLanguage;
    },

    /**
     * Name of the language detector.
     */
    name: 'configLanguageDetector'
};
