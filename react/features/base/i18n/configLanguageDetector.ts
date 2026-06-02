import { noop } from 'lodash-es';

/**
 * Custom language detection, just returns the config property if any.
 *
 * When config.js has not yet been loaded (e.g. SSI did not inject it and we
 * are fetching it asynchronously via appNavigate), this returns undefined so
 * other detectors in the chain take over. Once SET_CONFIG dispatches, the
 * i18n middleware applies defaultLanguage from the store via changeLanguage.
 */
export default {
    cacheUserLanguage: noop,

    /**
     * Looks the language up in the config.
     *
     * @returns {string | undefined} The default language if available.
     */
    lookup() {
        return window.config?.defaultLanguage;
    },

    /**
     * Name of the language detector.
     */
    name: 'configLanguageDetector'
};
