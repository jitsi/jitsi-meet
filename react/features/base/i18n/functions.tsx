import React from 'react';
import { WithTranslation, withTranslation } from 'react-i18next';

import i18next from './i18next';

/**
 * Changes the main translation bundle.
 *
 * @param {string} language - The language e.g. 'en', 'fr'.
 * @param {string} url - The url of the translation bundle.
 * @returns {void}
 */
export async function changeLanguageBundle(language: string, url: string) {
    const res = await fetch(url);
    const bundle = await res.json();

    i18next.addResourceBundle(language, 'main', bundle, true, true);
}

/**
 * Wraps a specific React Component in order to enable translations in it.
 *
 * @param {Component} component - The React Component to wrap.
 * @returns {Component} The React Component which wraps {@link component} and
 * enables translations in it.
 */
export function translate<P extends WithTranslation>(component: React.ComponentType<P>) {
    // Use the default list of namespaces.
    return withTranslation([ 'main', 'languages', 'countries' ])(component);
}

/**
 * Translates a specific key to text containing HTML via a specific translate
 * function.
 *
 * @param {Function} t - The translate function.
 * @param {string} key - The key to translate.
 * @param {Array<*>} options - The options, if any, to pass to {@link t}.
 * @returns {ReactElement} A ReactElement which depicts the translated HTML
 * text.
 */
export function translateToHTML(t: Function, key: string, options: Object = {}) {
    // eslint-disable-next-line react/no-danger
    return <span dangerouslySetInnerHTML = {{ __html: t(key, options) }} />;
}
