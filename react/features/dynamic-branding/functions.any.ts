import { IReduxState } from '../app/types';
import { IStateful } from '../base/app/types';
import { toState } from '../base/redux/functions';

import { CUSTOM_ICON_FETCH_TIMEOUT } from './constants';
import { cleanSvg } from './functions';
import logger from './logger';

/**
 * Extracts the fqn part from a path, where fqn represents
 * tenant/roomName.
 *
 * @param {Object} state - A redux state.
 * @returns {string}
 */
export function extractFqnFromPath(state?: IReduxState) {
    let pathname;

    if (window.location.pathname) {
        pathname = window.location.pathname;
    } else if (state?.['features/base/connection']) {
        pathname = state['features/base/connection'].locationURL?.pathname ?? '';
    } else {
        return '';
    }

    const parts = pathname.split('/');
    const len = parts.length;

    return parts.length > 2 ? `${parts[len - 2]}/${parts[len - 1]}` : parts[1];
}

/**
 * Returns the url used for fetching dynamic branding.
 *
 * @param {Object | Function} stateful - The redux store, state, or
 * {@code getState} function.
 * @returns {string}
 */
export async function getDynamicBrandingUrl(stateful: IStateful) {
    const state = toState(stateful);

    const config = state['features/base/config'];
    const { dynamicBrandingUrl } = config;

    if (dynamicBrandingUrl) {
        return dynamicBrandingUrl;
    }

    const { brandingDataUrl: baseUrl } = config;
    const fqn = extractFqnFromPath(state);

    if (baseUrl && fqn) {
        return `${baseUrl}?conferenceFqn=${encodeURIComponent(fqn)}`;
    }
}

/**
 * Selector used for getting the load state of the dynamic branding data.
 *
 * @param {Object} state - Global state of the app.
 * @returns {boolean}
 */
export function isDynamicBrandingDataLoaded(state: IReduxState) {
    return state['features/dynamic-branding'].customizationReady;
}

/**
 * Loads the SVG content of the given branding icons. The icons are requested in parallel and
 * each request is bounded by {@link CUSTOM_ICON_FETCH_TIMEOUT}, so a slow or dead URL delays
 * neither the other icons nor the rest of the branding. Icons that fail to load are logged
 * and left out of the result.
 *
 * @param {Record<string, string>} customIcons - Map of icon name to SVG URL.
 * @returns {Promise<Record<string, string>>} Map of icon name to sanitized SVG XML.
 */
export async function fetchCustomIcons(customIcons: Record<string, string>): Promise<Record<string, string>> {
    const entries = Object.entries(customIcons);
    const results = await Promise.allSettled(entries.map(entry => fetchCustomIcon(entry[1])));
    const localCustomIcons: Record<string, string> = {};

    results.forEach((result, index) => {
        const [ key, url ] = entries[index];

        if (result.status === 'fulfilled') {
            localCustomIcons[key] = result.value;
        } else {
            logger.error(`Error fetching custom icon ${key} from ${url}:`, result.reason);
        }
    });

    return localCustomIcons;
}

/**
 * Fetches a single icon SVG, giving up after {@link CUSTOM_ICON_FETCH_TIMEOUT}.
 *
 * @param {string} url - The URL of the SVG.
 * @returns {Promise<string>} The sanitized SVG XML.
 */
async function fetchCustomIcon(url: string): Promise<string> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), CUSTOM_ICON_FETCH_TIMEOUT);

    try {
        const response = await fetch(url, { signal: controller.signal });

        if (!response.ok) {
            throw new Error(`Unexpected status ${response.status}`);
        }

        return cleanSvg(await response.text());
    } finally {
        clearTimeout(timeout);
    }
}
