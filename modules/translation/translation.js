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

    const documentElement
        = document.documentElement || {};

    $('[data-i18n]').localize();
    documentElement.lang = i18next.language;
}

/**
 *
 */
class Translation {
    /**
     *
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
     *
     */
    generateTranslationHTML(key, options) {
        const optAttr
            = options ? ` data-i18n-options='${JSON.stringify(options)}'` : '';

        // XXX i18next expects undefined if options are missing.
        const text = i18next.t(key, options ? options : undefined);

        return `<span data-i18n="${key}"${optAttr}>${text}</span>`;
    }

    /**
     *
     */
    translateElement(selector, options) {
        // XXX i18next expects undefined if options are missing.
        selector.localize(options ? options : undefined);
    }
}

export default new Translation();
