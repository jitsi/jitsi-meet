// @flow

import { openDialog } from '../base/dialog';

import { SET_DETAILS } from './actionTypes';
import { PremiumFeatureDialog } from './components';
import { VPAAS_TENANT_PREFIX } from './constants';
import { getVpaasTenant, isFeatureDisabled, sendGetDetailsRequest } from './functions';
import logger from './logger';

/**
 * Action used to set the jaas customer details in store.
 *
 * @param {Object} details - The customer details object.
 * @returns {Object}
 */
function setCustomerDetails(details) {
    return {
        type: SET_DETAILS,
        payload: details
    };
}

/**
 * Sends a request for retrieving jaas customer details.
 *
 * @returns {Function}
 */
export function getCustomerDetails() {
    return async function(dispatch: Function, getState: Function) {
        const state = getState();
        const baseUrl = state['features/base/config'].jaasActuatorUrl;
        const jwt = state['features/base/jwt'].jwt;
        const appId = getVpaasTenant(state).replace(VPAAS_TENANT_PREFIX, '');

        const shouldSendRequest = Boolean(baseUrl && jwt && appId);

        if (shouldSendRequest) {
            try {
                const details = await sendGetDetailsRequest({
                    baseUrl,
                    jwt,
                    appId
                });

                dispatch(setCustomerDetails(details));
            } catch (err) {
                logger.error('Could not send request', err);
            }
        }
    };
}


/**
 * Shows a dialog prompting users to upgrade, if requested feature is disabled.
 *
 * @param {string} feature - The feature to check availability for.
 *
 * @returns {Function}
 */
export function maybeShowPremiumFeatureDialog(feature: string) {
    return function(dispatch: Function, getState: Function) {
        if (isFeatureDisabled(getState(), feature)) {
            dispatch(openDialog(PremiumFeatureDialog));

            return true;
        }

        return false;
    };
}
