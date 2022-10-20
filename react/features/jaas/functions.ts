import { IReduxState } from '../app/types';

import { VPAAS_TENANT_PREFIX } from './constants';
import logger from './logger';

/**
 * Returns the full vpaas tenant if available, given a path.
 *
 * @param {string} path - The meeting url path.
 * @returns {string}
 */
function extractVpaasTenantFromPath(path: string) {
    const [ , tenant ] = path.split('/');

    if (tenant.startsWith(VPAAS_TENANT_PREFIX)) {
        return tenant;
    }

    return '';
}

/**
 * Returns the vpaas tenant.
 *
 * @param {IReduxState} state - The global state.
 * @returns {string}
 */
export function getVpaasTenant(state: IReduxState) {
    return extractVpaasTenantFromPath(state['features/base/connection'].locationURL?.pathname ?? '');
}

/**
 * Returns true if the current meeting is a vpaas one.
 *
 * @param {IReduxState} state - The state of the app.
 * @returns {boolean}
 */
export function isVpaasMeeting(state: IReduxState) {
    const connection = state['features/base/connection'];

    if (connection?.locationURL?.pathname) {
        return Boolean(
            extractVpaasTenantFromPath(connection?.locationURL?.pathname)
        );
    }

    return false;
}

/**
 * Sends a request for retrieving jaas customer details.
 *
 * @param {Object} reqData - The request info.
 * @param {string} reqData.appId - The client appId.
 * @param {string} reqData.baseUrl - The base url for the request.
 * @returns {void}
 */
export async function sendGetDetailsRequest({ appId, baseUrl }: {
    appId: string;
    baseUrl: string;
}) {
    const fullUrl = `${baseUrl}/v1/public/tenants/${encodeURIComponent(appId)}`;

    try {
        const res = await fetch(fullUrl);

        if (res.ok) {
            return res.json();
        }

        throw new Error('Request not successful');
    } catch (err: any) {
        throw new Error(err);

    }
}

/**
 * Returns the billing id for vpaas meetings.
 *
 * @param {IReduxState} state - The state of the app.
 * @param {string} feature - Feature to be looked up for disable state.
 * @returns {boolean}
 */
export function isFeatureDisabled(state: IReduxState, feature: string) {
    return state['features/jaas'].disabledFeatures.includes(feature);
}

/**
 * Sends a request for retrieving jaas JWT.
 *
 * @param {Object} reqData - The request info.
 * @param {string} reqData.appId - The client appId.
 * @param {string} reqData.baseUrl - The base url for the request.
 * @returns {void}
 */
export async function sendGetJWTRequest({ appId, baseUrl }: {
    appId: string;
    baseUrl: string;
}) {
    const fullUrl = `${baseUrl}/v1/public/token/${encodeURIComponent(appId)}`;

    try {
        const res = await fetch(fullUrl, {
            method: 'GET'
        });

        if (res.ok) {
            return res.json();
        }

        throw new Error('Request not successful');
    } catch (err: any) {
        throw new Error(err);

    }
}

/**
 * Gets a jaas JWT.
 *
 * @param {IReduxState} state - Redux state.
 * @returns {string} The JWT.
 */
export async function getJaasJWT(state: IReduxState) {
    const baseUrl = state['features/base/config'].jaasTokenUrl;
    const appId = getVpaasTenant(state);

    const shouldSendRequest = Boolean(baseUrl && appId);

    if (shouldSendRequest) {
        try {
            const jwt = await sendGetJWTRequest({
                appId,
                baseUrl: baseUrl ?? ''
            });

            return jwt.token;
        } catch (err) {
            logger.error('Could not send request', err);
        }
    }
}
