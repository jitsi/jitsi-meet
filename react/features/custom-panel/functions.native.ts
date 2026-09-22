export * from './functions.any';

/**
 * Builds the advisor URL. Returns '' without a url or jwt (no token, no access).
 *
 * @param {string} [url] - The base advisor URL.
 * @param {string} [jwt] - The meeting JWT.
 * @param {string} [meetingId] - The meeting unique id.
 * @returns {string} The full URI, or '' when no url or no jwt is provided.
 */
export function buildCustomPanelUri(url?: string, jwt?: string, meetingId?: string): string {
    if (!url || !jwt) {
        return '';
    }

    let uri;

    try {
        uri = new URL(url);
    } catch (_) {
        return '';
    }

    uri.searchParams.set('token', jwt);

    if (meetingId) {
        uri.searchParams.set('meeting', meetingId);
    }

    return uri.toString();
}

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
