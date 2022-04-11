
/**
 * Appends a suffix to the display name.
 *
 * @param {string} displayName - The display name.
 * @param {string} suffix - Suffix that will be appended.
 * @returns {string} The formatted display name.
 */
export function appendSuffix(displayName: string, suffix = ''): string {
    return `${displayName || suffix}${
        displayName && suffix && displayName !== suffix ? ` (${suffix})` : ''}`;
}
