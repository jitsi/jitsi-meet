import DOMPurify from 'dompurify';
import React from 'react';

export { changeLanguageBundle, translate } from './functions.any';

const SANITIZE_CONFIG = {
    ALLOWED_TAGS: [ 'a', 'b', 'br', 'span' ],
    ALLOWED_ATTR: [ 'href', 'target', 'rel' ],
    ALLOWED_URI_REGEXP: /^https?:\/\//i
};

/**
 * Escapes a string for safe inclusion in HTML.
 *
 * @param {string} value - The string to escape.
 * @returns {string} The escaped string.
 */
function escapeHTML(value: string): string {
    const el = document.createElement('span');

    el.textContent = value;

    return el.innerHTML;
}

/**
 * Translates a specific key to text containing HTML via a specific translate
 * function.
 *
 * @param {Function} t - The translate function.
 * @param {string} key - The key to translate.
 * @param {Record<string, unknown>} options - The options, if any, to pass to {@link t}.
 * @returns {ReactElement} A ReactElement which depicts the translated HTML
 * text.
 */
export function translateToHTML(t: Function, key: string, options: Record<string, unknown> = {}) {
    const escapedOptions: Record<string, unknown> = {};

    for (const [ k, v ] of Object.entries(options)) {
        escapedOptions[k] = typeof v === 'string' ? escapeHTML(v) : v;
    }

    const html = DOMPurify.sanitize(t(key, escapedOptions), SANITIZE_CONFIG);

    // eslint-disable-next-line react/no-danger
    return <span dangerouslySetInnerHTML = {{ __html: html }} />;
}
