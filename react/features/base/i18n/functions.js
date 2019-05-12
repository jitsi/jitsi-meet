import React from 'react';
import { translate as reactI18nextTranslate } from 'react-i18next';

/**
 * Wraps a specific React Component in order to enable translations in it.
 *
 * @param {Component} component - The React Component to wrap.
 * @param {Object} options - Additional options to pass into react-i18next's
 * initialization.
 * @returns {Component} The React Component which wraps {@link component} and
 * enables translations in it.
 */
export function translate(component, options = { wait: true }) {
    // Use the default list of namespaces.
    return (
        reactI18nextTranslate([ 'main', 'languages', 'countries' ], options)(
            component));
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
export function translateToHTML(t, key, options = {}) {
    // eslint-disable-next-line react/no-danger
    return <span dangerouslySetInnerHTML = {{ __html: t(key, options) }} />;
}
