/* @flow */

import locale from 'react-native-locale-detector';

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
        return locale;
    },

    init: Function.prototype,

    type: 'languageDetector'
};
