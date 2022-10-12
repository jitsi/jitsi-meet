import { IStore } from '../app/types';
import { doGetJSON } from '../base/util/httpUtils';

import { UNSET_DYNAMIC_BRANDING } from './actionTypes';
import {
    setDynamicBrandingData,
    setDynamicBrandingFailed,
    setDynamicBrandingReady
} from './actions.any';
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
        const dynamicBrandingUrl = await getDynamicBrandingUrl(state);

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
        } else {
            dispatch(unsetDynamicBranding());
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
