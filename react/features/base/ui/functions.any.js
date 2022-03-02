// @flow

import { RTL_LANGUAGES } from './constants';

/**
 * Returns the direction of the app based on the language selected by user.
 *
 * @param {string} language - Current language of the app.
 * @returns {string}
 */
export function detectDirectionBasedOnLanguage(language) {
    if (RTL_LANGUAGES.includes(language)) {
        return 'rtl';
    }

    return 'ltr';
}
