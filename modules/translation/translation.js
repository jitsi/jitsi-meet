import $ from 'jquery';
import jqueryI18next from 'jquery-i18next';
import i18next from '../../react/features/base/i18n/i18next';

/**
 * Notifies that the {@link i18next} instance has finished its initialization.
 *
 * @returns {void}
 * @private
 */
function _onI18nInitialized() {
    const documentElement = document.documentElement || {};

    try {
        $('[data-i18n]').localize();
        documentElement.lang = i18next.language;
    } catch (error) {
        console.error('Error during localization:', error);
    }
}

/**
 * Translation class to handle translation-related functionalities.
 */
class Translation {
    /**
     * Initializes the Translation class and sets up i18next.
     */
    constructor() {
        jqueryI18next.init(i18next, $, { useOptionsAttr: true });

        if (i18next.isInitialized) {
            _onI18nInitialized();
        } else {
            i18next.on('initialized', _onI18nInitialized);
        }

        i18next.on('languageChanged', _onI18nInitialized);
    }

    /**
     * Generates HTML for the given translation key and options.
     *
     * @param {string} key - The i18next key.
     * @param {Object} [options] - Optional options for translation.
     * @returns {string} - The generated HTML string.
     */
    generateTranslationHTML(key, options) {
        const optAttr = options ? ` data-i18n-options='${JSON.stringify(options)}'` : '';

        // i18next expects undefined if options are missing.
        const text = i18next.t(key, options ? options : undefined);

        return `<span data-i18n="${key}"${optAttr}>${text}</span>`;
    }

    /**
     * Translates the elements matching the given selector.
     *
     * @param {jQuery} selector - jQuery selector for elements to translate.
     * @param {Object} [options] - Optional options for translation.
     * @returns {void}
     */
    translateElement(selector, options) {
        try {
            // i18next expects undefined if options are missing.
            selector.localize(options ? options : undefined);
        } catch (error) {
            console.error('Error during element localization:', error);
        }
    }
}

export default new Translation();