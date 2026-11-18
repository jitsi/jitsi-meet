export { changeLanguageBundle, translate } from './functions.any';

/**
 * Resolves the language to use once config.js is known. The system locale is the only detected language on native,
 * so config.defaultLanguage wins over it.
 *
 * @param {string} defaultLanguage - The config.defaultLanguage value, if any.
 * @returns {string | undefined}
 */
export function resolveConfigLanguage(defaultLanguage?: string) {
    return defaultLanguage;
}
