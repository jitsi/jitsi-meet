// @flow

import { jitsiLocalStorage } from '@jitsi/js-utils';

import { BILLING_ID, VPAAS_TENANT_PREFIX } from './constants';
import logger from './logger';

/**
 * Returns the full vpaas tenant if available, given a path.
 *
 * @param {string} path - The meeting url path.
 * @returns {string}
 */
export function extractVpaasTenantFromPath(path: string) {
    const [ , tenant ] = path.split('/');

    if (tenant.startsWith(VPAAS_TENANT_PREFIX)) {
        return tenant;
    }

    return '';
}

/**
 * Returns true if the current meeting is a vpaas one.
 *
 * @param {Object} state - The state of the app.
 * @returns {boolean}
 */
export function isVpaasMeeting(state: Object) {
    return Boolean(
        state['features/base/config'].billingCounterUrl
        && state['features/base/jwt'].jwt
        && extractVpaasTenantFromPath(
            state['features/base/connection'].locationURL.pathname)
    );
}

/**
 * Sends a billing counter request.
 *
 * @param {Object} reqData - The request info.
 * @param {string} reqData.baseUrl - The base url for the request.
 * @param {string} billingId - The unique id of the client.
 * @param {string} jwt - The JWT token.
 * @param {string} tenat - The client tenant.
 * @returns {void}
 */
export async function sendCountRequest({ baseUrl, billingId, jwt, tenant }: {
    baseUrl: string,
    billingId: string,
    jwt: string,
    tenant: string
}) {
    const fullUrl = `${baseUrl}/${encodeURIComponent(tenant)}/${billingId}`;
    const headers = {
        'Authorization': `Bearer ${jwt}`
    };

    try {
        const res = await fetch(fullUrl, {
            method: 'GET',
            headers
        });

        if (!res.ok) {
            logger.error('Status error:', res.status);
        }
    } catch (err) {
        logger.error('Could not send request', err);
    }
}

/**
 * Returns the stored billing id.
 *
 * @returns {string}
 */
export function getBillingId() {
    return jitsiLocalStorage.getItem(BILLING_ID);
}

/**
 * Stores the billing id.
 *
 * @param {string} value - The id to be stored.
 * @returns {void}
 */
export function setBillingId(value: string) {
    jitsiLocalStorage.setItem(BILLING_ID, value);
}
