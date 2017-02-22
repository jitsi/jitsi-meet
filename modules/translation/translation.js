/* global $ */
import { i18n, DEFAULT_LANG } from '../../react/features/base/translation';
import jqueryI18next from 'jquery-i18next';

function initCompleted() {
    $("[data-i18n]").localize();
}

class Translation {
    init () {
        if (i18n.isInitialized)
            initCompleted();
        else
            i18n.on('initialized', initCompleted);

        jqueryI18next.init(i18n, $, {useOptionsAttr: true});
    }

    setLanguage (lang) {
        if(!lang)
            lang = DEFAULT_LANG;
        i18n.setLng(lang, {}, initCompleted);
    }

    getCurrentLanguage () {
        return i18n.lng();
    }

    translateElement (selector, options) {
        // i18next expects undefined if options are missing, check if its null
        selector.localize(
            options === null ? undefined : options);
    }

    generateTranslationHTML (key, options) {
        let optAttr = options
            ? ` data-i18n-options='${JSON.stringify(options)}'` : "";
        let text = i18n.t(key, options === null ? undefined : options);
        return `<span data-i18n="${key}"${optAttr}>${text}</span>`;
    }

    addLanguageChangedListener(listener) {
        i18n.on('languageChanged', listener);
    }
}

export default new Translation();
