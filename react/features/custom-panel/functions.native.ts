export * from './functions.any';

/**
 * Returns the origin of the given URL, or '' on a parse error.
 *
 * @param {string} [url] - The URL to parse.
 * @returns {string}
 */
export function getCustomPanelOrigin(url?: string): string {
    if (!url) {
        return '';
    }

    try {
        return new URL(url).origin;
    } catch (_) {
        return '';
    }
}
