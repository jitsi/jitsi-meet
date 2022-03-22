// @flow

import { SET_DETAILS } from './actionTypes';
import { getVpaasTenant, sendGetDetailsRequest } from './functions';
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
        const baseUrl = state['features/base/config'].jaasActuatorUrl || 'https://api-vo-pilot.jitsi.net/jaas-actuator';
        const appId = getVpaasTenant(state);

        const shouldSendRequest = Boolean(baseUrl && appId);

        if (shouldSendRequest) {
            try {
                const details = await sendGetDetailsRequest({
                    appId,
                    baseUrl
                });

                dispatch(setCustomerDetails(details));
            } catch (err) {
                logger.error('Could not send request', err);
            }
        }
    };
}
