import i18next from 'i18next';

/**
 * The builtin languages.
 */
const _LANGUAGES = {

    // Afrikaans
    'af': {
        languages: require('../../../../lang/languages'),
        main: require('../../../../lang/main-af')
    },

    // Arabic
    'ar': {
        languages: require('../../../../lang/languages'),
        main: require('../../../../lang/main-ar')
    },

    // Bulgarian
    'bg': {
        languages: require('../../../../lang/languages'),
        main: require('../../../../lang/main-bg')
    },

    // Catalan
    'ca': {
        languages: require('../../../../lang/languages'),
        main: require('../../../../lang/main-ca')
    },

    // German
    'de': {
        languages: require('../../../../lang/languages'),
        main: require('../../../../lang/main-de')
    },

    // English (United Kingdom)
    'enGB': {
        languages: require('../../../../lang/languages'),
        main: require('../../../../lang/main-enGB')
    },

    // Esperanto
    'eo': {
        languages: require('../../../../lang/languages'),
        main: require('../../../../lang/main-eo')
    },

    // Spanish
    'es': {
        languages: require('../../../../lang/languages'),
        main: require('../../../../lang/main-es')
    },

    // Spanish (Latin America)
    'esUS': {
        languages: require('../../../../lang/languages'),
        main: require('../../../../lang/main-esUS')
    },

    // Estonian
    'et': {
        languages: require('../../../../lang/languages'),
        main: require('../../../../lang/main-et')
    },

    // Persian
    'fa': {
        languages: require('../../../../lang/languages'),
        main: require('../../../../lang/main-fa')
    },

    // Finnish
    'fi': {
        languages: require('../../../../lang/languages'),
        main: require('../../../../lang/main-fi')
    },

    // French
    'fr': {
        languages: require('../../../../lang/languages'),
        main: require('../../../../lang/main-fr')
    },

    // French (Canada)
    'frCA': {
        languages: require('../../../../lang/languages'),
        main: require('../../../../lang/main-frCA')
    },

    // Croatian
    'hr': {
        languages: require('../../../../lang/languages'),
        main: require('../../../../lang/main-hr')
    },

    // Hungarian
    'hu': {
        languages: require('../../../../lang/languages'),
        main: require('../../../../lang/main-hu')
    },

    // Italian
    'it': {
        languages: require('../../../../lang/languages'),
        main: require('../../../../lang/main-it')
    },

    // Japanese
    'ja': {
        languages: require('../../../../lang/languages'),
        main: require('../../../../lang/main-ja')
    },

    // Korean
    'ko': {
        languages: require('../../../../lang/languages'),
        main: require('../../../../lang/main-ko')
    },

    // Mongolian
    'mn': {
        languages: require('../../../../lang/languages'),
        main: require('../../../../lang/main-mn') },
    
    // Dutch
    'nl': {
        languages: require('../../../../lang/languages'),
        main: require('../../../../lang/main-nl')
    },

    // Occitan
    'oc': {
        languages: require('../../../../lang/languages'),
        main: require('../../../../lang/main-oc')
    },

    // Polish
    'pl': {
        languages: require('../../../../lang/languages'),
        main: require('../../../../lang/main-pl')
    },

    // Portuguese (Brazil)
    'ptBR': {
        languages: require('../../../../lang/languages'),
        main: require('../../../../lang/main-ptBR')
    },

    // Romanian
    'ro': {
        languages: require('../../../../lang/languages'),
        main: require('../../../../lang/main-ro')
    },

    // Russian
    'ru': {
        languages: require('../../../../lang/languages'),
        main: require('../../../../lang/main-ru')
    },
    
    // Sardinian (Sardinia)
    'sc': {
        languages: require('../../../../lang/languages'),
        main: require('../../../../lang/main-sc')
    },

    // Slovak
    'sk': {
        languages: require('../../../../lang/languages'),
        main: require('../../../../lang/main-sk')
    },

    // Slovenian
    'sl': {
        languages: require('../../../../lang/languages'),
        main: require('../../../../lang/main-sl')
    },
    
    // Swedish
    'sv': {
        languages: require('../../../../lang/languages'),
        main: require('../../../../lang/main-sv')
    },

    // Turkish
    'tr': {
        languages: require('../../../../lang/languages'),
        main: require('../../../../lang/main-tr')
    },

    // Vietnamese
    'vi': {
        languages: require('../../../../lang/languages'),
        main: require('../../../../lang/main-vi')
    },

    // Chinese (China)
    'zhCN': {
        languages: require('../../../../lang/languages'),
        main: require('../../../../lang/main-zhCN')
    },

    // Chinese (Taiwan)
    'zhTW': {
        languages: require('../../../../lang/languages'),
        main: require('../../../../lang/main-zhTW')
    }
};

// Register all builtin languages with the i18n library.
for (const name in _LANGUAGES) { // eslint-disable-line guard-for-in
    const { languages, main } = _LANGUAGES[name as keyof typeof _LANGUAGES];

    i18next.addResourceBundle(
        name,
        'languages',
        languages,
        /* deep */ true,
        /* overwrite */ true);
    i18next.addResourceBundle(
        name,
        'main',
        main,
        /* deep */ true,
        /* overwrite */ true);
}
