import { translate as reactTranslate } from 'react-i18next';
import React from 'react';

/**
 * Wrap a translatable component.
 *
 * @param {Component} component - The component to wrap.
 * @returns {Component} The wrapped component.
 */
export function translate(component) {
    // use the default list of namespaces
    return reactTranslate([ 'main', 'languages' ], { wait: true })(component);
}

/**
 * Translates key and prepares data to be passed to dangerouslySetInnerHTML.
 * Used when translation text contains html.
 *
 * @param {func} t - Translate function.
 * @param {string} key - The key to translate.
 * @param {Array} options - Optional options.
 * @returns {XML} A span using dangerouslySetInnerHTML to insert html text.
 */
export function translateToHTML(t, key, options = {}) {
    /* eslint-disable react/no-danger */
    return (
        <span
            dangerouslySetInnerHTML = {{ __html: t(key, options) }} />
    );

    /* eslint-enable react/no-danger */
}
