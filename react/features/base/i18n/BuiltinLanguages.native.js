// @flow

import i18next from 'i18next';

/**
 * The builtin languages.
 */
const _LANGUAGES = {

    // Bulgarian
    'bg': {
        languages: require('../../../../lang/languages-bg'),
        main: require('../../../../lang/main-bg')
    },

    // German
    'de': {
        languages: require('../../../../lang/languages-de'),
        main: require('../../../../lang/main-de')
    },

    // Esperanto
    'eo': {
        languages: require('../../../../lang/languages-eo'),
        main: require('../../../../lang/main-eo')
    },

    // Spanish
    'es': {
        languages: require('../../../../lang/languages-es'),
        main: require('../../../../lang/main-es')
    },

    // French
    'fr': {
        languages: require('../../../../lang/languages-fr'),
        main: require('../../../../lang/main-fr')
    },

    // Armenian
    'hy': {
        languages: require('../../../../lang/languages-hy'),
        main: require('../../../../lang/main-hy')
    },

    // Italian
    'it': {
        languages: require('../../../../lang/languages-it'),
        main: require('../../../../lang/main-it')
    },

    // Norwegian Bokmal
    'nb': {
        languages: require('../../../../lang/languages-nb'),
        main: require('../../../../lang/main-nb')
    },

    // Occitan
    'oc': {
        languages: require('../../../../lang/languages-oc'),
        main: require('../../../../lang/main-oc')
    },

    // Polish
    'pl': {
        languages: require('../../../../lang/languages-pl'),
        main: require('../../../../lang/main-pl')
    },

    // Portuguese (Brazil)
    'ptBR': {
        languages: require('../../../../lang/languages-ptBR'),
        main: require('../../../../lang/main-ptBR')
    },

    // Russian
    'ru': {
        languages: require('../../../../lang/languages-ru'),
        main: require('../../../../lang/main-ru')
    },

    // Slovak
    'sk': {
        languages: require('../../../../lang/languages-sk'),
        main: require('../../../../lang/main-sk')
    },

    // Slovenian
    'sl': {
        languages: require('../../../../lang/languages-sl'),
        main: require('../../../../lang/main-sl')
    },

    // Swedish
    'sv': {
        languages: require('../../../../lang/languages-sv'),
        main: require('../../../../lang/main-sv')
    },

    // Turkish
    'tr': {
        languages: require('../../../../lang/languages-tr'),
        main: require('../../../../lang/main-tr')
    },

    // Chinese (China)
    'zhCN': {
        languages: require('../../../../lang/languages-zhCN'),
        main: require('../../../../lang/main-zhCN')
    }
};

// Register all builtin languages with the i18n library.
for (const name in _LANGUAGES) { // eslint-disable-line guard-for-in
    const { languages, main } = _LANGUAGES[name];

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
