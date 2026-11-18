import React from 'react';

import languageDetector, { migrateLegacyLanguage } from './languageDetector';

export { changeLanguageBundle, translate } from './functions.any';
export { storeUserSelectedLanguage } from './languageDetector';

/**
 * The URLs a link in a translation is allowed to point to.
 */
const LINK_URL_REGEXP = /^https?:\/\//i;

/**
 * A line break which accepts children, and ignores them. A plain br element given children makes React throw, so a
 * translation which wrongly puts text in the tag of a line break would break the rendering.
 *
 * @returns {ReactElement}
 */
function LineBreak() {
    return <br />;
}

/**
 * Creates the element for a link in a translation which is rendered with TranslationWithMarkup. The
 * translation marks the text of the link with an index tag, for example "Read more <0>here</0>.", and this element is
 * given in its components at that index.
 *
 * The translation provides the text of the link, nothing else. The destination comes from the code and the link always
 * opens in a new browsing context, so it cannot navigate the user out of an ongoing meeting.
 *
 * @param {string} url - The URL the link points to. The text is not rendered as a link when it is missing or it is not
 * an http(s) URL.
 * @returns {ReactElement}
 */
export function createTranslationLink(url?: string) {
    if (url && LINK_URL_REGEXP.test(url)) {
        return (
            <a
                href = { url }
                rel = 'noopener noreferrer'
                target = '_blank' />
        );
    }

    return <span />;
}

/**
 * Creates the element for a line break in a translation which is rendered with TranslationWithMarkup.
 * The translation marks the line break with an index tag, for example "One.<0/>Two.", and this element is given in its
 * components at that index.
 *
 * @returns {ReactElement}
 */
export function createTranslationLineBreak() {
    return <LineBreak />;
}

/**
 * Resolves the language to use once config.js is known. The detection chain is run again, so a language from the
 * URL, the one the user picked or the browser one still wins over config.defaultLanguage.
 *
 * @param {string} _defaultLanguage - Not used on web: configLanguageDetector reads it from window.config, which is
 * the object SET_CONFIG carries.
 * @returns {string}
 */
export function resolveConfigLanguage(_defaultLanguage?: string): string {
    migrateLegacyLanguage();

    // Falls back to DEFAULT_LANGUAGE when nothing matched.
    return languageDetector.detect() as string;
}
