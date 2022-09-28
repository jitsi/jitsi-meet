
declare let navigator: any;

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

        found = found.map<string>(normalizeLanguage);

        return found.length > 0 ? found : undefined;
    },

    /**
     * Name of the language detector.
     */
    name: 'customNavigatorDetector'
};

/**
 * Normalize language format.
 *
 * (en-US => enUS)
 * (en-gb => enGB)
 * (es-es => es).
 *
 * @param {string} language - Language.
 * @returns {string} The normalized language.
 */
function normalizeLanguage(language: string) {
    const [ lang, variant ] = language.replace('_', '-').split('-');

    if (!variant || lang === variant) {
        return lang;
    }

    return lang + variant.toUpperCase();
}
