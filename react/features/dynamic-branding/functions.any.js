// @flow

import { loadConfig } from '../base/lib-jitsi-meet';

/**
 * Extracts the fqn part from a path, where fqn represents
 * tenant/roomName.
 *
 * @param {Object} state - A redux state.
 * @returns {string}
 */
export function extractFqnFromPath(state?: Object) {
    let pathname;

    if (window.location.pathname) {
        pathname = window.location.pathname;
    } else if (state && state['features/base/connection']) {
        pathname = state['features/base/connection'].locationURL.pathname;
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
 * @returns {string}
 */
export async function getDynamicBrandingUrl() {
    const config = await loadConfig(window.location.href);
    const { dynamicBrandingUrl } = config;

    if (dynamicBrandingUrl) {
        return dynamicBrandingUrl;
    }

    const { brandingDataUrl: baseUrl } = config;
    const fqn = extractFqnFromPath();

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
export function isDynamicBrandingDataLoaded(state: Object) {
    return state['features/dynamic-branding'].customizationReady;
}
