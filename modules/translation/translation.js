/* global $, require, config, interfaceConfig */
import i18n from 'i18next';
import XHR from 'i18next-xhr-backend';
import jqueryI18next from 'jquery-i18next';
var languages = require("../../service/translation/languages");
var languagesR = require("json!../../lang/languages.json");
var mainR = require("json!../../lang/main.json");
var DEFAULT_LANG = languages.EN;

var defaultOptions = {
    compatibilityAPI: 'v1',
    compatibilityJSON: 'v1',
    fallbackLng: DEFAULT_LANG,
    load: "unspecific",
    resGetPath: 'lang/__ns__-__lng__.json',
    ns: {
        namespaces: ['main', 'languages'],
        defaultNs: 'main'
    },
    lngWhitelist : languages.getLanguages(),
    fallbackOnNull: true,
    fallbackOnEmpty: true,
    useDataAttrOptions: true,
    app: interfaceConfig.APP_NAME
};

function initCompleted() {
    $("[data-i18n]").localize();
}

function getLangFromQuery() {
    var query = window.location.search.substring(1);
    var vars = query.split("&");
    for (var i=0;i<vars.length;i++) {
        var pair = vars[i].split("=");
        if(pair[0] == "lang")
        {
            return pair[1];
        }
    }
    return null;
}

module.exports = {
    init: function (settingsLang) {
        let options = defaultOptions;

        let lang = getLangFromQuery() || settingsLang || config.defaultLanguage;
        // XXX If none of the above has been set then the 'lang' will be
        // 'undefined' and the i18n lib will try to auto detect user's
        // preferred language based on browser's locale.
        // The interface config option allows to disable this auto detection
        // by specifying the fallback language in that case.
        let langDetection = interfaceConfig.LANG_DETECTION;

        if (!langDetection && !lang) {
            lang = DEFAULT_LANG;
        }

        if (lang) {
            options.lng = lang;
        }

        i18n.use(XHR)
            .use({
                type: 'postProcessor',
                name: "resolveAppName",
                process:
                    function (res, key) {
                        return i18n.t(key, {app: interfaceConfig.APP_NAME});
                    }
            })
            .init(options, initCompleted);
        // adds default language which is preloaded from code
        i18n.addResourceBundle(DEFAULT_LANG, 'main', mainR, true, true);
        i18n.addResourceBundle(
            DEFAULT_LANG, 'languages', languagesR, true, true);
        jqueryI18next.init(i18n, $, {useOptionsAttr: true});
    },
    setLanguage: function (lang) {
        if(!lang)
            lang = DEFAULT_LANG;
        i18n.setLng(lang, defaultOptions, initCompleted);
    },
    getCurrentLanguage: function () {
        return i18n.lng();
    },
    translateElement: function (selector, options) {
        // i18next expects undefined if options are missing, check if its null
        selector.localize(
            options === null ? undefined : options);
    },
    generateTranslationHTML: function (key, options) {
        var str = "<span data-i18n=\"" + key + "\"";
        if (options) {
            str += " data-i18n-options='" + JSON.stringify(options) + "'";
        }
        str += ">";
        // i18next expects undefined if options ARE missing, check if its null
        str += i18n.t(key, options === null ? undefined : options);
        str += "</span>";
        return str;

    },
    addLanguageChangedListener: function(listener) {
        i18n.on('languageChanged', listener);
    }
};
