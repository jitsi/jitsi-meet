
import { doGetJSON } from '../base/util';

import { UNSET_DYNAMIC_BRANDING } from './actionTypes';
import {
    setDynamicBrandingData,
    setDynamicBrandingFailed,
    setDynamicBrandingReady,
    logger
} from './actions.any';


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
        const { dynamicBrandingUrl } = state['features/base/config'];

        if (dynamicBrandingUrl) {
            try {
                return dispatch(
                    setDynamicBrandingData(
                    await doGetJSON(dynamicBrandingUrl))
                );
            } catch (err) {
                logger.error('Error fetching branding data', err);

                return dispatch(
                    setDynamicBrandingFailed()
                );
            }
        }

        dispatch(setDynamicBrandingReady());
    };
}

/**
 * Action used to unset branding elements.
 *
 * @returns {Object}
 */
export function unsetDynamicBranding() {
    return {
        type: UNSET_DYNAMIC_BRANDING
    };
}
