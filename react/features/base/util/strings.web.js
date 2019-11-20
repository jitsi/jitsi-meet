// @flow

/**
 * Applies NFKC normalization to the given text.
 *
 * @param {string} text - The text that needs to be normalized.
 * @returns {string} - The normalized text.
 */
export function normalizeNFKC(text: string) {
    return text.normalize('NFKC');
}
