// @flow

import { toState } from '../base/redux';


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
 * @param {Object | Function} stateful - The redux store, state, or
 * {@code getState} function.
 * @returns {string}
 */
export async function getDynamicBrandingUrl(stateful: Object | Function) {
    const state = toState(stateful);

    // NB: On web this is dispatched really early, before the config has been stored in the
    // state. Thus, fetch it from the window global.
    const config
        = navigator.product === 'ReactNative' ? state['features/base/config'] : window.config;
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
export function isDynamicBrandingDataLoaded(state: Object) {
    return state['features/dynamic-branding'].customizationReady;
}
