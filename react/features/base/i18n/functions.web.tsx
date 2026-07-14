import DOMPurify from 'dompurify';
import React from 'react';

export { changeLanguageBundle, translate } from './functions.any';

const SANITIZE_CONFIG = {
    ALLOWED_TAGS: [ 'a', 'b', 'br', 'span' ],

    // `target` and `rel` are intentionally not allowed here: they are forced to
    // safe values by the hook below so a translation cannot control them.
    ALLOWED_ATTR: [ 'href' ],
    ALLOWED_URI_REGEXP: /^https?:\/\//i
};

// A dedicated DOMPurify instance so the link-hardening hook below stays scoped
// to translated HTML and does not leak into other consumers of the shared
// instance (e.g. branding SVG sanitizing).
const purify = DOMPurify(window);

// Force links produced from (potentially translator-supplied) strings to open
// in a new browsing context. This prevents a translation from navigating the
// user out of an ongoing meeting via target="_self" (or "_top"/"_parent", or by
// omitting target, which defaults to same-context navigation) and pairs the new
// tab with rel="noopener noreferrer" to prevent reverse tabnabbing.
purify.addHook('afterSanitizeAttributes', (node: Element) => {
    if (node.tagName === 'A') {
        node.setAttribute('target', '_blank');
        node.setAttribute('rel', 'noopener noreferrer');
    }
});

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

    const html = purify.sanitize(t(key, escapedOptions), SANITIZE_CONFIG);

    // eslint-disable-next-line react/no-danger
    return <span dangerouslySetInnerHTML = {{ __html: html }} />;
}
