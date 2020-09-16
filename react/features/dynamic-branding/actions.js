// @flow

import { getLogger } from 'jitsi-meet-logger';

import { doGetJSON } from '../base/util';

import {
    SET_DYNAMIC_BRANDING_DATA,
    SET_DYNAMIC_BRANDING_FAILED,
    SET_DYNAMIC_BRANDING_READY
} from './actionTypes';
import { extractFqnFromPath } from './functions';

const logger = getLogger(__filename);

/**
 * Fetches custom branding data.
 * If there is no data or the request fails, sets the `customizationReady` flag
 * so the defaults can be displayed.
 *
 * @returns {Function}
 */
export function fetchCustomBrandingData() {
    return async function(dispatch: Function, getState: Function) {
        const state = getState();
        const baseUrl = state['features/base/config'].brandingDataUrl;
        const { customizationReady } = state['features/dynamic-branding'];

        if (!customizationReady) {
            const fqn = extractFqnFromPath(state['features/base/connection'].locationURL.pathname);

            if (baseUrl && fqn) {
                try {
                    const res = await doGetJSON(`${baseUrl}?conferenceFqn=${encodeURIComponent(fqn)}`);

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
 * Action used to set the user customizations.
 *
 * @param {Object} value - The custom data to be set.
 * @returns {Object}
 */
function setDynamicBrandingData(value) {
    return {
        type: SET_DYNAMIC_BRANDING_DATA,
        value
    };
}

/**
 * Action used to signal the branding elements are ready to be displayed.
 *
 * @returns {Object}
 */
function setDynamicBrandingReady() {
    return {
        type: SET_DYNAMIC_BRANDING_READY
    };
}

/**
 * Action used to signal the branding request failed.
 *
 * @returns {Object}
 */
function setDynamicBrandingFailed() {
    return {
        type: SET_DYNAMIC_BRANDING_FAILED
    };
}
