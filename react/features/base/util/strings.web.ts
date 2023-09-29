/**
 * Applies NFKC normalization to the given text.
 *
 * @param {string} text - The text that needs to be normalized.
 * @returns {string} - The normalized text.
 */
export function normalizeNFKC(text: string) {
    return text.normalize('NFKC');
}

/**
 * Replaces accent characters with english alphabet characters.
 * NOTE: Here we use the unorm package because the JSC version in React Native for Android crashes.
 *
 * @param {string} text - The text that needs to be normalized.
 * @returns {string} - The normalized text.
 */
export function normalizeAccents(text: string) {
    return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}
