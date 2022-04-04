// @flow

import { doGetJSON } from '../base/util';

/**
 * Fetches the Salesforce records that were most recently interacted with.
 *
 * @param {string} url - The endpoint for the session records.
 * @param {string} jwt - The JWT needed for authentication.
 * @returns {Promise<any>}
 */
export async function getRecentSessionRecords(
        url: string,
        jwt: string
) {
    return doGetJSON(`${url}/records/recents`, true, {
        headers: {
            'Authorization': `Bearer ${jwt}`
        }
    });
}

/**
 * Fetches the Salesforce records that match the search criteria.
 *
 * @param {string} url - The endpoint for the session records.
 * @param {string} jwt - The JWT needed for authentication.
 * @param {string} text - The search term for the session record to find.
 * @returns {Promise<any>}
 */
export async function searchSessionRecords(
        url: string,
        jwt: string,
        text: string
) {
    return doGetJSON(`${url}/records?text=${text}`, true, {
        headers: {
            'Authorization': `Bearer ${jwt}`
        }
    });
}

/**
* Fetches the Salesforce record details from the server.
*
* @param {string} url - The endpoint for the record details.
* @param {string} jwt - The JWT needed for authentication.
* @param {Object} item - The item for which details are being retrieved.
* @returns {Promise<any>}
*/
export async function getSessionRecordDetails(
        url: string,
        jwt: string,
        item: Object
) {
    const fullUrl = `${url}/records/${item.id}?type=${item.type}`;

    return doGetJSON(fullUrl, true, {
        headers: {
            'Authorization': `Bearer ${jwt}`
        }
    });
}

/**
* Executes the meeting linking.
*
* @param {string} url - The endpoint for meeting linking.
* @param {string} jwt - The JWT needed for authentication.
* @param {string} sessionId - The ID of the meeting session.
* @param {Object} body - The body of the request.
* @returns {Object}
*/
export async function executeLinkMeetingRequest(
        url: string,
        jwt: string,
        sessionId: String,
        body: Object
) {
    const fullUrl = `${url}/sessions/${sessionId}/records/${body.id}`;
    const res = await fetch(fullUrl, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${jwt}`
        },
        body: JSON.stringify(body)
    });

    const json = await res.json();

    return res.ok ? json : Promise.reject(json);
}
