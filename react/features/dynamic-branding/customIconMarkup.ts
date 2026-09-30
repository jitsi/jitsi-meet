import { fetchWithTimeout } from '../base/util/fetchWithTimeout';

import { CUSTOM_ICON_FETCH_TIMEOUT } from './constants';

/**
 * Tells whether a custom icon value is inline SVG markup rather than a URL to fetch it from.
 * Inline markup lets the branding payload carry the icons themselves, saving one request per icon.
 *
 * @param {string} value - The custom icon value from the branding data.
 * @returns {boolean}
 */
export function isInlineSvg(value: string): boolean {
    return value.trimStart().startsWith('<');
}

/**
 * Downloads the raw markup of a custom icon, giving up after {@link CUSTOM_ICON_FETCH_TIMEOUT}.
 * Sanitizing is left to the caller so this can also run in the preload bundle, which has to stay
 * small.
 *
 * @param {string} url - The URL of the SVG.
 * @returns {Promise<string>} The raw SVG markup.
 */
export async function fetchCustomIconMarkup(url: string): Promise<string> {
    const response = await fetchWithTimeout(url, CUSTOM_ICON_FETCH_TIMEOUT);

    if (!response.ok) {
        throw new Error(`Unexpected status ${response.status}`);
    }

    return response.text();
}
