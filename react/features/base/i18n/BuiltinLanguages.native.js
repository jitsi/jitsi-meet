import i18next from 'i18next';

/**
 * Collection of builtin languages.
 */
const languages = [

    // Bulgarian
    {
        name: 'bg',
        mainResource: require('../../../../lang/main-bg'),
        langResource: require('../../../../lang/languages-bg')
    },

    // German
    {
        name: 'de',
        mainResource: require('../../../../lang/main-de'),
        langResource: require('../../../../lang/languages-de')
    },

    // Esperanto
    {
        name: 'eo',
        mainResource: require('../../../../lang/main-eo'),
        langResource: require('../../../../lang/languages-eo')
    },

    // Spanish
    {
        name: 'es',
        mainResource: require('../../../../lang/main-es'),
        langResource: require('../../../../lang/languages-es')
    },

    // French
    {
        name: 'fr',
        mainResource: require('../../../../lang/main-fr'),
        langResource: require('../../../../lang/languages-fr')
    },

    // Armenian
    {
        name: 'hy',
        mainResource: require('../../../../lang/main-hy'),
        langResource: require('../../../../lang/languages-hy')
    },

    // Italian
    {
        name: 'it',
        mainResource: require('../../../../lang/main-it'),
        langResource: require('../../../../lang/languages-it')
    },

    // Norwegian Bokmal
    {
        name: 'nb',
        mainResource: require('../../../../lang/main-nb'),
        langResource: require('../../../../lang/languages-nb')
    },

    // Occitan
    {
        name: 'oc',
        mainResource: require('../../../../lang/main-oc'),
        langResource: require('../../../../lang/languages-oc')
    },

    // Polish
    {
        name: 'pl',
        mainResource: require('../../../../lang/main-pl'),
        langResource: require('../../../../lang/languages-pl')
    },

    // Portuguese (Brazil)
    {
        name: 'ptBR',
        mainResource: require('../../../../lang/main-ptBR'),
        langResource: require('../../../../lang/languages-ptBR')
    },

    // Russian
    {
        name: 'ru',
        mainResource: require('../../../../lang/main-ru'),
        langResource: require('../../../../lang/languages-ru')
    },

    // Slovak
    {
        name: 'sk',
        mainResource: require('../../../../lang/main-sk'),
        langResource: require('../../../../lang/languages-sk')
    },

    // Slovenian
    {
        name: 'sl',
        mainResource: require('../../../../lang/main-sl'),
        langResource: require('../../../../lang/languages-sl')
    },

    // Swedish
    {
        name: 'sv',
        mainResource: require('../../../../lang/main-sv'),
        langResource: require('../../../../lang/languages-sv')
    },

    // Turkish
    {
        name: 'tr',
        mainResource: require('../../../../lang/main-tr'),
        langResource: require('../../../../lang/languages-tr')
    },

    // Chinese (China)
    {
        name: 'zhCN',
        mainResource: require('../../../../lang/main-zhCN'),
        langResource: require('../../../../lang/languages-zhCN')
    }
];

/**
 * Registers all builtin languages with the i18n library.
 */
for (const language of languages) {
    i18next.addResourceBundle(
        language.name,
        'main',
        language.mainResource,
        /* deep */ true,
        /* overwrite */ true);
    i18next.addResourceBundle(
        language.name,
        'languages',
        language.langResource,
        /* deep */ true,
        /* overwrite */ true);
}
