// @flow
import { SET_ENDPOINT_COUNTED } from './actionTypes';
import { extractVpaasTenantFromPath, getBillingId, sendCountRequest } from './functions';

/**
 * Sends a billing count request when needed.
 * If there is no billingId, it presists one first and sends the request after.
 *
 * @returns {Function}
 */
export function countEndpoint() {
    return function(dispatch: Function, getState: Function) {
        const state = getState();
        const baseUrl = state['features/base/config'].billingCounterUrl;
        const jwt = state['features/base/jwt'].jwt;
        const tenant = extractVpaasTenantFromPath(state['features/base/connection'].locationURL.pathname);
        const shouldSendRequest = Boolean(baseUrl && jwt && tenant);

        if (shouldSendRequest) {
            sendCountRequest({
                billingId: getBillingId(),
                baseUrl,
                jwt,
                tenant
            });
            dispatch(setEndpointCounted());
        }
    };
}

/**
 * Action used to mark the endpoint as counted.
 *
 * @returns {Object}
 */
function setEndpointCounted() {
    return {
        type: SET_ENDPOINT_COUNTED
    };
}
