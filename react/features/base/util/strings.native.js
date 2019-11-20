// @flow

import * as unorm from 'unorm';

/**
 * Applies NFKC normalization to the given text.
 * NOTE: Here we use the unorm package because the JSC version in React Native for Android crashes.
 *
 * @param {string} text - The text that needs to be normalized.
 * @returns {string} - The normalized text.
 */
export function normalizeNFKC(text: string) {
    return unorm.nfkc(text);
}
