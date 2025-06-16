import { IReduxState } from '../app/types';
import { IStateful } from '../base/app/types';
import { toState } from '../base/redux/functions';

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
export function isDynamicBrandingDataLoaded(state: IReduxState) {
    return state['features/dynamic-branding'].customizationReady;
}

/**
 * Fetch SVG XMLs from branding icons urls.
 *
 * @param {Object} customIcons - The map of branded icons.
 * @returns {Object}
 */
export const fetchCustomIcons = async (customIcons: Record<string, string>) => {
    const localCustomIcons: Record<string, string> = {};

    for (const [ key, url ] of Object.entries(customIcons)) {
        try {
            const response = await fetch(url);

            if (response.ok) {
                const svgXml = await response.text();

                localCustomIcons[key] = svgXml;
            } else {
                logger.error(`Failed to fetch ${url}. Status: ${response.status}`);
            }
        } catch (error) {
            logger.error(`Error fetching ${url}:`, error);
        }
    }

    return localCustomIcons;
};
