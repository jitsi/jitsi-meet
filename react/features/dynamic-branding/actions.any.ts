import { IStore } from '../app/types';
import { doGetJSON } from '../base/util/httpUtils';
import { takePreloadedBranding } from '../preload/functions';

import {
    SET_DYNAMIC_BRANDING_DATA,
    SET_DYNAMIC_BRANDING_FAILED,
    SET_DYNAMIC_BRANDING_ICONS,
    SET_DYNAMIC_BRANDING_READY
} from './actionTypes';
import { getDynamicBrandingUrl } from './functions.any';
import logger from './logger';


/**
 * Fetches custom branding data.
 * If there is no data or the request fails, sets the `customizationReady` flag
 * so the defaults can be displayed.
 *
 * @returns {Function}
 */
export function fetchCustomBrandingData() {
    return async function(dispatch: IStore['dispatch'], getState: IStore['getState']) {
        const state = getState();
        const { customizationReady } = state['features/dynamic-branding'];

        if (!customizationReady) {
            const url = await getDynamicBrandingUrl(state);

            if (url) {
                try {
                    const res = await fetchBrandingData(url);

                    return dispatch(setDynamicBrandingData(res));
                } catch (err) {
                    logger.error('Error fetching branding data', err);

                    return dispatch(setDynamicBrandingFailed());
                }
            }

            dispatch(setDynamicBrandingReady());
        }
    };
}

/**
 * Fetches the branding data from the given URL, reusing the response the preload script already
 * started downloading for it when there is one.
 *
 * @param {string} url - The branding URL.
 * @returns {Promise<Object>}
 */
async function fetchBrandingData(url: string): Promise<Object> {
    const preloaded = takePreloadedBranding(url);

    if (preloaded) {
        try {
            return await preloaded;
        } catch (err) {
            logger.warn('Preloaded branding data failed, fetching it again', err);
        }
    }

    return doGetJSON(url);
}

/**
 * Action used to set the user customizations.
 *
 * @param {Object} value - The custom data to be set.
 * @returns {Object}
 */
export function setDynamicBrandingData(value: Object) {
    return {
        type: SET_DYNAMIC_BRANDING_DATA,
        value
    };
}

/**
 * Action used to set the loaded branded icons.
 *
 * @param {Record<string, string>} icons - Map of icon name to sanitized SVG XML.
 * @returns {Object}
 */
export function setDynamicBrandingIcons(icons: Record<string, string>) {
    return {
        type: SET_DYNAMIC_BRANDING_ICONS,
        icons
    };
}

/**
 * Action used to signal the branding elements are ready to be displayed.
 *
 * @returns {Object}
 */
export function setDynamicBrandingReady() {
    return {
        type: SET_DYNAMIC_BRANDING_READY
    };
}

/**
 * Action used to signal the branding request failed.
 *
 * @returns {Object}
 */
export function setDynamicBrandingFailed() {
    return {
        type: SET_DYNAMIC_BRANDING_FAILED
    };
}
