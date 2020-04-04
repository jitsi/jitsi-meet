// @flow

import i18next from 'i18next';

/**
 * The builtin languages.
 */
const _LANGUAGES = {

    // Afrikaans
    'af': {
        languages: require('../../../../lang/languages-af'),
        main: require('../../../../lang/main-af')
    },

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

    // English (United Kingdom)
    'enGB': {
        languages: require('../../../../lang/languages-enGB'),
        main: require('../../../../lang/main-enGB')
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

    // Spanish (Latin America)
    'esUS': {
        languages: require('../../../../lang/languages-esUS'),
        main: require('../../../../lang/main-esUS')
    },

    // Estonian
    'et': {
        languages: require('../../../../lang/languages-et'),
        main: require('../../../../lang/main-et')
    },

    // Finnish
    'fi': {
        languages: require('../../../../lang/languages-fi'),
        main: require('../../../../lang/main-fi')
    },

    // French
    'fr': {
        languages: require('../../../../lang/languages-fr'),
        main: require('../../../../lang/main-fr')
    },

    // French (Canadian)
    'frCA': {
        languages: require('../../../../lang/languages-frCA'),
        main: require('../../../../lang/main-frCA')
    },

    // Croatian
    'hr': {
        languages: require('../../../../lang/languages-hr'),
        main: require('../../../../lang/main-hr')
    },

    // Hungarian
    'hu': {
        languages: require('../../../../lang/languages-hu'),
        main: require('../../../../lang/main-hu')
    },

    // Italian
    'it': {
        languages: require('../../../../lang/languages-it'),
        main: require('../../../../lang/main-it')
    },

    // Japanese
    'ja': {
        languages: require('../../../../lang/languages-ja'),
        main: require('../../../../lang/main-ja')
    },

    // Korean
    'ko': {
        languages: require('../../../../lang/languages-ko'),
        main: require('../../../../lang/main-ko')
    },

    // Dutch
    'nl': {
        languages: require('../../../../lang/languages-nl'),
        main: require('../../../../lang/main-nl')
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

    // Swedish
    'sv': {
        languages: require('../../../../lang/languages-sv'),
        main: require('../../../../lang/main-sv')
    },

    // Vietnamese
    'vi': {
        languages: require('../../../../lang/languages-vi'),
        main: require('../../../../lang/main-vi')
    },

    // Chinese (China)
    'zhCN': {
        languages: require('../../../../lang/languages-zhCN'),
        main: require('../../../../lang/main-zhCN')
    },

    // Chinese (Taiwan)
    'zhTW': {
        languages: require('../../../../lang/languages-zhTW'),
        main: require('../../../../lang/main-zhTW')
    },

    // Mongolian
    'mn': { languages: require('../../../../lang/languages-mn'),
        main: require('../../../../lang/main-mn') }
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
