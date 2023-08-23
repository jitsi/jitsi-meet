import i18next from 'i18next';

/**
 * The builtin languages.
 */
const _LANGUAGES = {

    // Afrikaans
    'af': {
        main: require('../../../../lang/main-af')
    },

    // Arabic
    'ar': {
        main: require('../../../../lang/main-ar')
    },

    // Bulgarian
    'bg': {
        main: require('../../../../lang/main-bg')
    },

    // Catalan
    'ca': {
        main: require('../../../../lang/main-ca')
    },

    // German
    'de': {
        main: require('../../../../lang/main-de')
    },

    // Esperanto
    'eo': {
        main: require('../../../../lang/main-eo')
    },

    // Spanish
    'es': {
        main: require('../../../../lang/main-es')
    },

    // Spanish (Latin America)
    'esUS': {
        main: require('../../../../lang/main-esUS')
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
    'frCA': {
        main: require('../../../../lang/main-frCA')
    },

    // Croatian
    'hr': {
        main: require('../../../../lang/main-hr')
    },

    // Hungarian
    'hu': {
        main: require('../../../../lang/main-hu')
    },

    // Italian
    'it': {
        main: require('../../../../lang/main-it')
    },

    // Japanese
    'ja': {
        main: require('../../../../lang/main-ja')
    },

    // Korean
    'ko': {
        main: require('../../../../lang/main-ko')
    },

    // Mongolian
    'mn': {
        main: require('../../../../lang/main-mn')
    },

    // Dutch
    'nl': {
        main: require('../../../../lang/main-nl')
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
    'ptBR': {
        main: require('../../../../lang/main-ptBR')
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
    'zhCN': {
        main: require('../../../../lang/main-zhCN')
    },

    // Chinese (Traditional)
    'zhTW': {
        main: require('../../../../lang/main-zhTW')
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
