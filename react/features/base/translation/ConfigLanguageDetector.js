/* global config */

/**
 * Custom language detection, just returns the config property if any.
 */
export default {
    /**
     * Name of the language detector.
     */
    name: 'configLanguageDetector',

    /**
     * The actual lookup.
     *
     * @returns {string} The default language if any.
     */
    lookup() {
        return config.defaultLanguage;
    },

    /**
     * Doesn't support caching.
     */
    cacheUserLanguage: Function.prototype
};
