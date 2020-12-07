// @flow
import { jitsiLocalStorage } from '@jitsi/js-utils';
import uuid from 'uuid';

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
 * Compose the url used for sending billing counter requests.
 *
 * @param {string} baseUrl - The base url for the request.
 * @param {string} tenant - The client tenant.
 * @param {string} billingId - The unique id of the client.
 * @returns {string}
 */
const composeUrl = (baseUrl, tenant, billingId) => {
    const url = `${baseUrl}/${encodeURIComponent(tenant)}`;

    if (billingId) {
        return `${url}/${billingId}`;
    }

    return url;
};


/**
 * Sends a billing counter request.
 *
 * @param {Object} reqData - The request info.
 * @param {string} reqData.baseUrl - The base url for the request.
 * @param {string} billingId - The unique id of the client.
 * @param {string} jwt - The JWT token.
 * @param {string} tenant - The client tenant.
 * @returns {void}
 */
export async function sendCountRequest({ baseUrl, billingId, jwt, tenant }: {
    baseUrl: string,
    billingId: string,
    jwt: string,
    tenant: string
}) {
    const headers = {
        'Authorization': `Bearer ${jwt}`
    };

    try {
        const res = await fetch(composeUrl(baseUrl, tenant, billingId), {
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
 * Returns the stored billing id if available. Generates a new otherwise.
 *
 * @returns {string}
 */
export function getBillingId() {
    let billingId;

    try {
        billingId = jitsiLocalStorage.getItem(BILLING_ID);

        if (!billingId) {
            billingId = uuid.v4();
            jitsiLocalStorage.setItem(BILLING_ID, billingId);
        }
    } catch (err) {
        billingId = '';
        logger.error('Could not read from local storage', err);
    }

    return billingId;
}
