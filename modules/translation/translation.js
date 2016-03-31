/* global $, require, config, interfaceConfig */
var i18n = require("i18next-client");
var languages = require("../../service/translation/languages");
var DEFAULT_LANG = languages.EN;

i18n.addPostProcessor("resolveAppName", function(value, key, options) {
    return value.replace("__app__", interfaceConfig.APP_NAME);
});



var defaultOptions = {
    detectLngQS: "lang",
    useCookie: false,
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
    app: interfaceConfig.APP_NAME,
    getAsync: true,
    defaultValueFromContent: false,
    customLoad: function(lng, ns, options, done) {
        var resPath = "lang/__ns__-__lng__.json";
        if(lng === languages.EN)
            resPath = "lang/__ns__.json";
        var url = i18n.functions.applyReplacement(resPath,
                                                 { lng: lng, ns: ns });
        i18n.functions.ajax({
            url: url,
            success: function(data, status, xhr) {
                i18n.functions.log('loaded: ' + url);
                done(null, data);
            },
            error : function(xhr, status, error) {
                if ((status && status == 200) ||
                    (xhr && xhr.status && xhr.status == 200)) {
                    // file loaded but invalid json, stop waste time !
                    i18n.functions.error('There is a typo in: ' + url);
                } else if ((status && status == 404) ||
                    (xhr && xhr.status && xhr.status == 404)) {
                    i18n.functions.log('Does not exist: ' + url);
                } else {
                    var theStatus = status ? status :
                        ((xhr && xhr.status) ? xhr.status : null);
                    i18n.functions.log(theStatus + ' when loading ' + url);
                }

                done(error, {});
            },
            dataType: "json",
            async : options.getAsync
        });
    }
    //              options for caching
//                useLocalStorage: true,
//                localStorageExpirationTime: 86400000 // in ms, default 1 week
};

function initCompleted(t) {
    $("[data-i18n]").i18n();
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
        if (lang) {
            options.lng = lang;
        }

        i18n.init(options, initCompleted);
    },
    translateString: function (key, options) {
        return i18n.t(key, options);
    },
    setLanguage: function (lang) {
        if(!lang)
            lang = DEFAULT_LANG;
        i18n.setLng(lang, defaultOptions, initCompleted);
    },
    getCurrentLanguage: function () {
        return i18n.lng();
    },
    translateElement: function (selector) {
        selector.i18n();
    },
    generateTranslationHTML: function (key, options) {
        var str = "<span data-i18n=\"" + key + "\"";
        if (options) {
            str += " data-i18n-options=\"" + JSON.stringify(options) + "\"";
        }
        str += ">";
        str += this.translateString(key, options);
        str += "</span>";
        return str;

    }
};
