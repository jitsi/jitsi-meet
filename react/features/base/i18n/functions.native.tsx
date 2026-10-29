import React from 'react';
import { Text } from 'react-native';

export { changeLanguageBundle, translate } from './functions.any';

/**
 * Translates a specific key to text containing HTML via a specific translate
 * function. On native, HTML tags are stripped and the plain text is rendered.
 *
 * @param {Function} t - The translate function.
 * @param {string} key - The key to translate.
 * @param {Record<string, unknown>} options - The options, if any, to pass to {@link t}.
 * @returns {ReactElement} A ReactElement which depicts the translated text.
 */
export function translateToHTML(t: Function, key: string, options: Record<string, unknown> = {}) {
    const text = t(key, options).replace(/<[^>]*>/g, '');

    return <Text>{ text }</Text>;
}

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
