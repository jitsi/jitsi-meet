/* @flow */

declare var navigator: Object;

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
        let found = [];

        if (typeof navigator !== 'undefined') {
            if (navigator.languages) {
                // chrome only; not an array, so can't use .push.apply instead of iterating
                for (let i = 0; i < navigator.languages.length; i++) {
                    found.push(navigator.languages[i]);
                }
            }
            if (navigator.userLanguage) {
                found.push(navigator.userLanguage);
            }
            if (navigator.language) {
                found.push(navigator.language);
            }
        }

        // Fix language format (en-US => enUS)
        found = found.map<string>(f => f.replace(/[-_]+/g, ''));

        return found.length > 0 ? found : undefined;
    },

    /**
     * Name of the language detector.
     */
    name: 'customNavigatorDetector'
};
