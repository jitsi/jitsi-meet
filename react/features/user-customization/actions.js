// @flow

import { getLogger } from 'jitsi-meet-logger';

import { doGetJSON } from '../base/util';

import { SET_USER_CUSTOM_DATA } from './actionTypes';
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
        const baseUrl = state['features/base/config']._brandingDataUrl;
        const { customizationReady } = state['features/user-customization'];

        if (!customizationReady) {
            const fqn = extractFqnFromPath(state['features/base/connection'].locationURL.pathname);

            if (baseUrl && fqn) {
                try {
                    const res = await doGetJSON(`${baseUrl}?conferenceFqn=${encodeURIComponent(fqn)}`);

                    return dispatch(setUserCustomData(res));
                } catch (err) {
                    logger.error('Error fetching branding data', err);
                }
            }

            dispatch(setUserCustomData({
                customizationReady: true
            }));
        }
    };
}

/**
 * Action used to set the user customizations.
 *
 * @param {Object} value - The custom data to be set.
 * @returns {Object}
 */
function setUserCustomData(value) {
    return {
        type: SET_USER_CUSTOM_DATA,
        value
    };
}
