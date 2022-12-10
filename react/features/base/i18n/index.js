export * from './dateUtil';
export * from './functions';

// TODO Eventually (e.g. when the non-React Web app is rewritten into React), it
// should not be necessary to export i18next.
export { default as i18next, DEFAULT_LANGUAGE,
    LANGUAGES, TRANSLATION_LANGUAGES, TRANSLATION_LANGUAGES_HEAD } from './i18next';
