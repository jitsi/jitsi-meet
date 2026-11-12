import i18next from '../../react/features/base/i18n/i18next';

/**
 * Sets the language of the document to the language of {@link i18next}.
 *
 * @returns {void}
 * @private
 */
function _updateDocumentLanguage() {
    document.documentElement.lang = i18next.language;
}

/**
 * Keeps the language of the document in sync with the language of the app.
 *
 * NOTE: Do not translate DOM elements from here. A document-wide pass which
 * reads translation keys from element attributes lets any markup that reaches
 * the DOM (translations, branding) inject HTML.
 */
class Translation {
    /**
     *
     */
    constructor() {
        if (i18next.isInitialized) {
            _updateDocumentLanguage();
        } else {
            i18next.on('initialized', _updateDocumentLanguage);
        }

        i18next.on('languageChanged', _updateDocumentLanguage);
    }
}

export default new Translation();
