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
