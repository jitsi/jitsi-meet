import React from 'react';
import { WithTranslation, withTranslation } from 'react-i18next';

import { IReduxState } from '../../app/types';

import i18next, { LANGUAGES } from './i18next';

/**
 * Changes the main translation bundle.
 *
 * @param {string} language - The language e.g. 'en', 'fr'.
 * @param {string} url - The url of the translation bundle.
 * @param {string} ns - The namespace of the translation bundle.
 * @returns {void}
 */
export async function changeLanguageBundle(language: string, url: string, ns = 'main') {
    const res = await fetch(url);
    const bundle = await res.json();

    i18next.addResourceBundle(language, ns, bundle, true, true);
}

/**
 * Returns the list of languages to show in the UI language selector.
 * Respects config.supportedLanguages order and filtering if configured.
 * Works on both web (config loaded before bundle) and native (config from Redux).
 *
 * @param {IReduxState} state - The Redux state.
 * @returns {Array<string>}
 */
export function getSupportedLanguages(state: IReduxState): Array<string> {
    const supported = state['features/base/config']?.supportedLanguages;

    if (Array.isArray(supported) && supported.length > 0) {
        return supported.filter(lang => LANGUAGES.includes(lang));
    }

    return LANGUAGES;
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
