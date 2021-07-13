// @flow

import { jitsiLocalStorage } from '@jitsi/js-utils';
import uuid from 'uuid';

import { BILLING_ID, VPAAS_TENANT_PREFIX } from './constants';

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
 * Returns the vpaas tenant.
 *
 * @param {Object} state - The global state.
 * @returns {string}
 */
export function getVpaasTenant(state: Object) {
    return extractVpaasTenantFromPath(state['features/base/connection'].locationURL.pathname);
}

/**
 * Returns true if the current meeting is a vpaas one.
 *
 * @param {Object} state - The state of the app.
 * @param {boolean} requiredJwt - Whether jwt is required or not.
 * @returns {boolean}
 */
export function isVpaasMeeting(state: Object, requiredJwt: boolean = true) {
    const { billingCounterUrl, iAmRecorder, iAmSipGateway } = state['features/base/config'];
    const { jwt } = state['features/base/jwt'];

    const jwtBoolean = requiredJwt ? Boolean(jwt) : true;

    const isAllowed = iAmRecorder || iAmSipGateway || jwtBoolean;

    return Boolean(
        billingCounterUrl
        && extractVpaasTenantFromPath(
            state['features/base/connection'].locationURL.pathname)
        && isAllowed
    );
}

/**
 * Returns the stored billing id (or generates a new one if none is present).
 *
 * @returns {string}
 */
export function getBillingId() {
    let billingId = jitsiLocalStorage.getItem(BILLING_ID);

    if (!billingId) {
        billingId = uuid.v4();
        jitsiLocalStorage.setItem(BILLING_ID, billingId);
    }

    return billingId;
}

/**
 * Returns the billing id for vpaas meetings.
 *
 * @param {Object} state - The state of the app.
 * @returns {string | undefined}
 */
export function getVpaasBillingId(state: Object) {
    if (isVpaasMeeting(state)) {
        return getBillingId();
    }
}
