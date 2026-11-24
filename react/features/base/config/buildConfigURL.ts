import { parseURLParams } from '../util/parseURLParams';
import {
    appendURLParam,
    getNormalizedRoomName,
    parseURIString
} from '../util/uri';

/**
 * Builds the config.js URL for a given location and optional room name.
 * Extracted to avoid duplication between app navigation (native) and shard-change reconnect (web).
 *
 * @param {URL | { href: string }} locationURL - The location URL.
 * @param {string | null | undefined} room - Optional room name to append as a query param.
 * @returns {string} The full config.js URL with room and release params appended as needed.
 */
export function buildConfigURL(locationURL: URL, room?: string | null): string {
    const { protocol, host, contextRoot } = parseURIString(locationURL.href);
    const normalizedProtocol = protocol === 'http:' || protocol === 'https:' ? protocol : 'https:';
    const baseURL = `${normalizedProtocol}//${host}${contextRoot || '/'}`;
    let url = `${baseURL}config.js`;

    if (room) {
        url = appendURLParam(url, 'room', getNormalizedRoomName(room) ?? '');
    }

    const { release } = parseURLParams(locationURL, true, 'search');

    if (release) {
        url = appendURLParam(url, 'release', release as string);
    }

    return url;
}
