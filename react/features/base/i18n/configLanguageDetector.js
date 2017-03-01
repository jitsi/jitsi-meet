/* @flow */

declare var config: Object;

/**
 * Custom language detection, just returns the config property if any.
 */
export default {
    /**
     * Does not support caching.
     *
     * @returns {void}
     */
    cacheUserLanguage: Function.prototype,

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
