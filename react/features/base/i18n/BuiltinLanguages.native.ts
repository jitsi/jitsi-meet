import i18next from 'i18next';

/**
 * The builtin languages.
 */
const _LANGUAGES = {

    // Afrikaans
    'af': {
        main: require('../../../../lang/main-af')
    },
    // Belarusian
    'be': {
        main: require('../../../../lang/main-be')
    },
    //  Bulgarian
    'bg': {
        main: require('../../../../lang/main-bg')
    },
    // Arabic
    'ar': {
        main: require('../../../../lang/main-ar')
    },

    // Catalan
    'ca': {
        main: require('../../../../lang/main-ca')
    },
   //Czech
   'cs': {
    main: require('../../../../lang/main-cs')
   },
   // Danish
   'da': {
    main: require('../../../../lang/main-da')
   },
    // German
    'de': {
        main: require('../../../../lang/main-de')
    },
    //Lower Sorbian
    'dsb': {
        main: require('../../../../lang/main-dsb')
    },
    //Greek 
    'el': {
        main: require('../../../../lang/main-el')
    },
    // Esperanto
    'eo': {
        main: require('../../../../lang/main-eo')
    },

    // Spanish (Latin America)
    'es-US': {
        main: require('../../../../lang/main-es-US')
    },
    //Spanish 
    'es': {
        main: require('../../../../lang/main-es')
    },
    // Estonian
    'et': {
        main: require('../../../../lang/main-et')
    },

    // Persian
    'fa': {
        main: require('../../../../lang/main-fa')
    },

    // Finnish
    'fi': {
        main: require('../../../../lang/main-fi')
    },

    // French
    'fr': {
        main: require('../../../../lang/main-fr')
    },

    // French (Canadian)
    'fr-CA': {
        main: require('../../../../lang/main-fr-CA')
    },
    // Hindi
    'hi': {
        main: require('../../../../lang/main-hi')
    },

    // Croatian
    'hr': {
        main: require('../../../../lang/main-hr')
    },
    'hsb': {
        main: require('../../../../lang/main-hsb')
    },

    // Hungarian
    'hu': {
        main: require('../../../../lang/main-hu')
    },
    // Arminian
    'hy': {
         main: require('../../../../lang/main-hy')
    },
    'id': {
        main: require('../../../../lang/main-id')
    },
    // Icelandic
    'is': {
        main: require('../../../../lang/main-is')
    },

    // Italian
    'it': {
        main: require('../../../../lang/main-it')
    },

    // Japanese
    'ja': {
        main: require('../../../../lang/main-ja')
    },
     // kabyle
     'kab': {
        main: require('../../../../lang/main-kab')
     },
    'kk': {
        main: require('../../../../lang/main-kk')
    },
    // Korean
    'ko': {
        main: require('../../../../lang/main-ko')
    },
    // Lithuanian
    'lt': {
     main: require('../../../../lang/main-lt')   
    },
    //Latvian

    'lv': {
        main: require('../../../../lang/main-lv')
    },
    // Malyalam
    'ml': {
        main: require('../../../../lang/main-ml')
    },

    // Mongolian
    'mn': {
        main: require('../../../../lang/main-mn')
    },

    'mr': {
        main: require('../../../../lang/main-mr')
    },
    // Norwegian
    'nb': {
        main: require('../../../../lang/main-nb')
    },

    // Dutch
    'nl':{
        main: require('../../../../lang/main-nl')
    },
    // Norwegian
    'no': {
        main: require('../../../../lang/main-no')
    },

    // Occitan
    'oc': {
        main: require('../../../../lang/main-oc')
    },

    // Polish
    'pl': {
        main: require('../../../../lang/main-pl')
    },

    // Portuguese (Brazil)
    'pt-BR': {
        main: require('../../../../lang/main-pt-BR')
    },
    // Portuguese 
    'pt': {
        main: require('../../../../lang/main-pt')
    },
   
    // Romanian
    'ro': {
        main: require('../../../../lang/main-ro')
    },

    // Russian
    'ru': {
        main: require('../../../../lang/main-ru')
    },

    // Sardinian (Sardinia)
    'sc': {
        main: require('../../../../lang/main-sc')
    },

    // Slovak
    'sk': {
        main: require('../../../../lang/main-sk')
    },

    // Slovenian
    'sl': {
        main: require('../../../../lang/main-sl')
    },

    // Swedish
    'sv': {
        main: require('../../../../lang/main-sv')
    },
    // Alabnian 
    'sq': {
        main: require('../../../../lang/main-sq')
    },
    // Serbian
    'sr': {
        main: require('../../../../lang/main-sr')
    },
    // Telugu
    'te': {
        main: require('../../../../lang/main-te')
    },

    // Turkish
    'tr': {
        main: require('../../../../lang/main-tr')
    },

    // Ukrainian
    'uk': {
        main: require('../../../../lang/main-uk')
    },

    // Vietnamese
    'vi': {
        main: require('../../../../lang/main-vi')
    },

    // Chinese (Simplified)
    'zh-CN': {
        main: require('../../../../lang/main-zh-CN')
    },

    // Chinese (Traditional)
    'zh-TW': {
        main: require('../../../../lang/main-zh-TW')
    }
};

// Register all builtin languages with the i18n library.
for (const name in _LANGUAGES) { // eslint-disable-line guard-for-in
    const { main } = _LANGUAGES[name as keyof typeof _LANGUAGES];

    i18next.addResourceBundle(
        name,
        'main',
        main,
        /* deep */ true,
        /* overwrite */ true);
}
