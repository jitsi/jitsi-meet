// @flow

/**
 * Extracts the fqn part from a path, where fqn represents
 * tenant/roomName.
 *
 * @param {string} path - The URL path.
 * @returns {string}
 */
export function extractFqnFromPath(path: string) {
    const parts = path.split('/');
    const len = parts.length;

    return parts.length > 2 ? `${parts[len - 2]}/${parts[len - 1]}` : '';
}

/**
 * Returns the url used for fetching dynamic branding.
 *
 * @param {Object} state - The state of the app.
 * @returns {string}
 */
export function getDynamicBrandingUrl(state: Object) {
    const { dynamicBrandingUrl } = state['features/base/config'];

    if (dynamicBrandingUrl) {
        return dynamicBrandingUrl;
    }

    const baseUrl = state['features/base/config'].brandingDataUrl;
    const fqn = extractFqnFromPath(state['features/base/connection'].locationURL.pathname);

    if (baseUrl && fqn) {
        return `${baseUrl}?conferenceFqn=${encodeURIComponent(fqn)}`;
    }
}
