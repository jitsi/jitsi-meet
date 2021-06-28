// @flow

/**
 * Sends a request for retrieving jaas customer details.
 *
 * @param {Object} reqData - The request info.
 * @param {string} reqData.appId - The client appId.
 * @param {string} reqData.baseUrl - The base url for the request.
 * @param {string} reqData.jwt - The JWT token.
 * @returns {void}
 */
export async function sendGetDetailsRequest({ appId, baseUrl, jwt }: {
    appId: string,
    baseUrl: string,
    jwt: string,
}) {
    const fullUrl = `${baseUrl}/v1/customers/${encodeURIComponent(appId)}`;
    const headers = {
        'Authorization': `Bearer ${jwt}`
    };

    try {
        const res = await fetch(fullUrl, {
            method: 'GET',
            headers
        });

        if (res.ok) {
            return res.json();
        }

        throw new Error('Request not successful');
    } catch (err) {
        throw new Error(err);

    }
}

/**
 * Returns the billing id for vpaas meetings.
 *
 * @param {Object} state - The state of the app.
 * @param {string} feature - Feature to be looked up for disable state.
 * @returns {boolean}
 */
export function isFeatureDisabled(state: Object, feature: string) {
    return state['features/jaas'].disabledFeatures.includes(feature);
}
